
import { Session, UserSettings, DEFAULT_SETTINGS, SyncQueueItem, NetPositionMetrics, PenaltyCalculation } from '../types';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, getDay, subDays } from 'date-fns';

const STORAGE_KEYS = {
  SESSIONS: 'd1_sessions',
  SETTINGS: 'd1_settings',
  VERSION: 'd1_version',
  SYNC_QUEUE: 'd1_sync_queue'
};

export const CURRENT_VERSION = '1.3';

// UTILITY: Get Local YYYY-MM-DD
export const getLocalDate = (): string => {
  const now = new Date();
  return dateToLocalDateString(now);
};

// UTILITY: Convert Date to Local YYYY-MM-DD string
const dateToLocalDateString = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - (offset * 60 * 1000));
  return local.toISOString().split('T')[0];
};

export const getSessions = (): Session[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load sessions", e);
    return [];
  }
};

export const saveSession = (session: Session): void => {
  const sessions = getSessions();
  const updated = [session, ...sessions];
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
  
  // Trigger Cloud Sync
  const settings = getSettings();
  if (settings.googleSheetsUrl) {
    syncToGoogleSheets(session, settings.googleSheetsUrl);
  }
};

export const getSettings = (): UserSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const clearData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
};

export const checkVersion = (): boolean => {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    return false; // Version mismatch
  }
  return true;
};

// --- BACKUP & RESTORE ---

export const exportDataJSON = (): string => {
  const data = {
    version: CURRENT_VERSION,
    timestamp: new Date().toISOString(),
    sessions: getSessions(),
    settings: getSettings()
  };
  return JSON.stringify(data, null, 2);
};

export const importDataJSON = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.sessions || !Array.isArray(data.sessions)) {
      throw new Error("Invalid format: missing sessions array");
    }
    
    // Merge strategy: Overwrite local with imported
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
    
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
        ...DEFAULT_SETTINGS,
        ...data.settings
      }));
    }
    
    return true;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
};

// --- CLOUD SYNC LOGIC ---

const getSyncQueue = (): SyncQueueItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveSyncQueue = (queue: SyncQueueItem[]) => {
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
};

export const syncToGoogleSheets = async (session: Session, url: string) => {
  try {
    // Google Apps Script Web App requests usually require 'no-cors' mode 
    // or properly configured CORS headers on the script side.
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(session)
    });
    console.log("Sync request sent");
  } catch (e) {
    console.error("Sync failed, adding to queue", e);
    const queue = getSyncQueue();
    queue.push({
      id: Math.random().toString(36).substr(2, 9),
      session,
      status: 'PENDING',
      retryCount: 0
    });
    saveSyncQueue(queue);
  }
};

export const testCloudConnection = async (url: string): Promise<boolean> => {
  try {
    // Send a dummy PING payload to verify connectivity
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: 'PING', notes: 'Connection Test' })
    });
    // Since 'no-cors' hides the status, we rely on lack of network error
    // To truly verify, the user must check their sheet, but this confirms the request left the browser.
    return true;
  } catch (e) {
    console.error("Connection test failed", e);
    return false;
  }
};

export const processSyncQueue = async () => {
  const settings = getSettings();
  if (!settings.googleSheetsUrl) return;

  const queue = getSyncQueue();
  if (queue.length === 0) return;

  const newQueue: SyncQueueItem[] = [];

  for (const item of queue) {
    try {
      await fetch(settings.googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.session)
      });
      console.log(`Processed queue item ${item.id}`);
    } catch (e) {
      // Keep in queue if it fails again
      item.retryCount++;
      newQueue.push(item);
    }
  }
  
  saveSyncQueue(newQueue);
};

// --- NET POSITION METRICS ---

/**
 * Calculate net position for a single session
 * Net Position = Actual Duration - Target Duration
 * Positive = Surplus (user did more than committed)
 * Negative = Deficit (user owes time)
 */
export const getSessionNetPosition = (session: Session): number => {
  const target = session.targetDurationSeconds ?? session.durationSeconds;
  return session.durationSeconds - target;
};

/**
 * Calculate net position metrics for the current week
 */
export const calculateNetPositionMetrics = (sessions: Session[]): NetPositionMetrics => {
  const todayStr = getLocalDate();
  const todayDate = new Date();
  
  // Current week (Monday to Sunday)
  const weekStart = startOfWeek(todayDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(todayDate, { weekStartsOn: 1 });
  
  // Filter sessions for current week
  const weeklySessions = sessions.filter(s => 
    isWithinInterval(parseISO(s.date), { start: weekStart, end: weekEnd })
  );
  
  // Today's sessions
  const todaySessions = sessions.filter(s => s.date === todayStr);
  
  // Calculate today's net position
  const todayNetPositionSeconds = todaySessions.reduce((acc, s) => 
    acc + getSessionNetPosition(s), 0
  );
  
  // Calculate weekly net position
  const weeklyNetPositionSeconds = weeklySessions.reduce((acc, s) => 
    acc + getSessionNetPosition(s), 0
  );
  
  // Calculate average for the week (days with sessions)
  const daysWithSessions = new Set(weeklySessions.map(s => s.date)).size;
  const weeklyAverageNetPositionSeconds = daysWithSessions > 0 
    ? weeklyNetPositionSeconds / daysWithSessions 
    : 0;
  
  // Get Friday's net position (for Saturday unlock)
  // Friday is day 5 (0=Sunday, 1=Monday, ..., 5=Friday)
  const currentDay = getDay(todayDate);
  let fridayDate: Date;
  
  if (currentDay === 6) {
    // If today is Saturday, look at yesterday (Friday)
    fridayDate = subDays(todayDate, 1);
  } else if (currentDay === 0) {
    // If today is Sunday, look at Friday (2 days ago)
    fridayDate = subDays(todayDate, 2);
  } else if (currentDay < 5) {
    // If before Friday, use the previous week's Friday
    fridayDate = subDays(todayDate, currentDay + 2);
  } else {
    // If today is Friday
    fridayDate = todayDate;
  }
  
  const fridayStr = dateToLocalDateString(fridayDate);
  
  // Get all sessions up to and including Friday for average calculation
  const fridayWeekStart = startOfWeek(fridayDate, { weekStartsOn: 1 });
  const sessionsUpToFriday = sessions.filter(s => {
    const sessionDate = parseISO(s.date);
    return isWithinInterval(sessionDate, { start: fridayWeekStart, end: fridayDate }) 
      && sessionDate <= fridayDate;
  });
  
  const daysUpToFriday = new Set(sessionsUpToFriday.map(s => s.date)).size;
  const netPositionUpToFriday = sessionsUpToFriday.reduce((acc, s) => 
    acc + getSessionNetPosition(s), 0
  );
  const avgUpToFriday = daysUpToFriday > 0 ? netPositionUpToFriday / daysUpToFriday : 0;
  
  // Saturday is unlocked if average net position by Friday night is positive
  // Show unlock status on all days (not just Saturday) so users can plan ahead
  const isSaturdayUnlocked = avgUpToFriday > 0;
  
  // Calculate total owed (only negative positions)
  const totalOwedSeconds = weeklySessions.reduce((acc, s) => {
    const netPos = getSessionNetPosition(s);
    return acc + (netPos < 0 ? Math.abs(netPos) : 0);
  }, 0);
  
  return {
    todayNetPositionSeconds,
    weeklyNetPositionSeconds,
    weeklyAverageNetPositionSeconds,
    fridayNetPositionSeconds: avgUpToFriday,
    isSaturdayUnlocked,
    totalOwedSeconds
  };
};

/**
 * Calculate penalty based on weekly deficit
 * This is a MOCK calculation - no actual payment processing
 */
export const calculatePenalty = (totalOwedSeconds: number): PenaltyCalculation => {
  const totalMinutesOwed = Math.ceil(totalOwedSeconds / 60);
  
  // Mock penalty: $1 per 10 minutes owed (adjustable rate)
  const PENALTY_RATE_PER_10_MIN = 1.0;
  const penaltyAmount = Math.ceil((totalMinutesOwed / 10) * PENALTY_RATE_PER_10_MIN);
  
  let description = '';
  if (totalMinutesOwed === 0) {
    description = 'No penalty - all commitments met! 🎉';
  } else if (totalMinutesOwed < 30) {
    description = `Light deficit. Penalty: $${penaltyAmount} to accountability partner.`;
  } else if (totalMinutesOwed < 120) {
    description = `Moderate deficit. Penalty: $${penaltyAmount} to charity of friend's choice.`;
  } else {
    description = `Significant deficit. Penalty: $${penaltyAmount} + extra accountability session required.`;
  }
  
  return {
    totalMinutesOwed,
    penaltyAmount,
    description
  };
};
