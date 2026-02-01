
import { Session, UserSettings, DEFAULT_SETTINGS, SyncQueueItem } from '../types';
import { getLocalDate } from '../utils/dateUtils';

const STORAGE_KEYS = {
  SESSIONS: 'highbeta_sessions',
  SETTINGS: 'highbeta_settings',
  VERSION: 'highbeta_version',
  SYNC_QUEUE: 'highbeta_sync_queue',
  TIMER_STATE: 'highbeta_timer_state'
};

export { STORAGE_KEYS };

export const CURRENT_VERSION = '1.3';

// Re-export for backward compatibility
export { getLocalDate };

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
  
  // Trigger Firebase Cloud Sync if callback is set
  if (cloudSyncCallback) {
    cloudSyncCallback(session).catch(err => {
      console.error('Firebase sync failed:', err);
    });
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
  
  // Trigger Firebase Cloud Sync if callback is set
  if (cloudSettingsSyncCallback) {
    cloudSettingsSyncCallback(settings).catch(err => {
      console.error('Firebase settings sync failed:', err);
    });
  }
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

// --- FIREBASE CLOUD SYNC HELPERS ---
// These are optional hooks for Firebase sync, keeping localStorage as primary storage

/**
 * Optional callback for syncing a session to Firebase after saving to localStorage
 * This should be set by App.tsx when a user is authenticated
 * 
 * Note: Using module-level mutable variables here is intentional to keep the storage
 * service decoupled from Firebase. This allows the storage service to remain simple
 * and backward-compatible while enabling optional cloud sync without dependencies.
 */
export let cloudSyncCallback: ((session: Session) => Promise<void>) | null = null;

export const setCloudSyncCallback = (callback: ((session: Session) => Promise<void>) | null) => {
  cloudSyncCallback = callback;
};

/**
 * Optional callback for syncing settings to Firebase after saving to localStorage
 * This should be set by App.tsx when a user is authenticated
 */
export let cloudSettingsSyncCallback: ((settings: UserSettings) => Promise<void>) | null = null;

export const setCloudSettingsSyncCallback = (callback: ((settings: UserSettings) => Promise<void>) | null) => {
  cloudSettingsSyncCallback = callback;
};

// --- SESSION EDIT & DELETE FUNCTIONS ---

/**
 * Update an existing session with new data
 * Increments editCount and updates lastModified timestamp
 */
export const updateSession = (sessionId: string, updates: Partial<Session>): Session | null => {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex === -1) {
    console.error('Session not found:', sessionId);
    return null;
  }
  
  const session = sessions[sessionIndex];
  const updatedSession: Session = {
    ...session,
    ...updates,
    id: session.id, // Prevent ID from being changed
    lastModified: Date.now(),
    editCount: (session.editCount || 0) + 1,
  };
  
  sessions[sessionIndex] = updatedSession;
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  
  // Trigger Firebase Cloud Sync if callback is set
  if (cloudSyncCallback) {
    cloudSyncCallback(updatedSession).catch(err => {
      console.error('Firebase sync failed for updated session:', err);
    });
  }
  
  return updatedSession;
};

/**
 * Delete a session (soft delete by default)
 * @param sessionId - ID of the session to delete
 * @param softDelete - If true, marks as deleted but keeps in database. If false, permanently removes.
 */
export const deleteSession = (sessionId: string, softDelete: boolean = true): boolean => {
  const sessions = getSessions();
  
  if (softDelete) {
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      console.error('Session not found:', sessionId);
      return false;
    }
    
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      deleted: true,
      lastModified: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    
    // Trigger Firebase Cloud Sync if callback is set
    if (cloudSyncCallback) {
      cloudSyncCallback(sessions[sessionIndex]).catch(err => {
        console.error('Firebase sync failed for deleted session:', err);
      });
    }
  } else {
    // Hard delete - permanently remove from array
    const filtered = sessions.filter(s => s.id !== sessionId);
    
    if (filtered.length === sessions.length) {
      console.error('Session not found:', sessionId);
      return false;
    }
    
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
    // Note: For hard delete, we don't sync to cloud as the session is gone
  }
  
  return true;
};

/**
 * Get visible sessions (excludes soft-deleted sessions by default)
 * @param includeDeleted - If true, includes soft-deleted sessions
 */
export const getVisibleSessions = (includeDeleted: boolean = false): Session[] => {
  const sessions = getSessions();
  if (includeDeleted) {
    return sessions;
  }
  return sessions.filter(s => !s.deleted);
};
