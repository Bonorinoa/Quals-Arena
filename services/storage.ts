
import { Session, UserSettings, DEFAULT_SETTINGS, SyncQueueItem } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'highbeta_sessions',
  SETTINGS: 'highbeta_settings',
  VERSION: 'highbeta_version',
  SYNC_QUEUE: 'highbeta_sync_queue'
};

export const CURRENT_VERSION = '1.3';

// UTILITY: Get Local YYYY-MM-DD
export const getLocalDate = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - (offset * 60 * 1000));
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
