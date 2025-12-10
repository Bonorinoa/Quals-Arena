
import { Session, UserSettings, DEFAULT_SETTINGS, SyncQueueItem } from '../types';
import { getLocalDate } from '../utils/dateUtils';

const STORAGE_KEYS = {
  SESSIONS: 'highbeta_sessions',
  SETTINGS: 'highbeta_settings',
  VERSION: 'highbeta_version',
  SYNC_QUEUE: 'highbeta_sync_queue'
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
