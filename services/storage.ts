
import { Session, UserSettings, DEFAULT_SETTINGS } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'd1_sessions',
  SETTINGS: 'd1_settings',
  VERSION: 'd1_version', // To manage data migrations
};

export const CURRENT_VERSION = '1.1';

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
  // We generally want to keep settings (Name, Goals) even if we clear metrics
  // But for a hard reset:
  // localStorage.removeItem(STORAGE_KEYS.SETTINGS); 
};

export const checkVersion = (): boolean => {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    return false; // Version mismatch
  }
  return true;
};
