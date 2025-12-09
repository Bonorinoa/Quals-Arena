import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSessions,
  saveSession,
  getSettings,
  saveSettings,
  clearData,
  checkVersion,
  exportDataJSON,
  importDataJSON,
  CURRENT_VERSION,
} from '../services/storage';
import { Session, UserSettings, DEFAULT_SETTINGS } from '../types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getSessions', () => {
    it('should return empty array when no sessions exist', () => {
      expect(getSessions()).toEqual([]);
    });

    it('should return stored sessions', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 3600, reps: 5, notes: '', date: '2024-01-01' },
      ];
      localStorage.setItem('highbeta_sessions', JSON.stringify(sessions));
      expect(getSessions()).toEqual(sessions);
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('highbeta_sessions', 'invalid json');
      expect(getSessions()).toEqual([]);
    });
  });

  describe('saveSession', () => {
    it('should save a new session', () => {
      const session: Session = {
        id: '1',
        timestamp: Date.now(),
        durationSeconds: 3600,
        reps: 5,
        notes: 'Test session',
        date: '2024-01-01',
      };
      
      saveSession(session);
      const sessions = getSessions();
      
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toEqual(session);
    });

    it('should prepend new sessions (newest first)', () => {
      const session1: Session = {
        id: '1',
        timestamp: Date.now(),
        durationSeconds: 3600,
        reps: 5,
        notes: '',
        date: '2024-01-01',
      };
      
      const session2: Session = {
        id: '2',
        timestamp: Date.now(),
        durationSeconds: 1800,
        reps: 3,
        notes: '',
        date: '2024-01-02',
      };
      
      saveSession(session1);
      saveSession(session2);
      
      const sessions = getSessions();
      expect(sessions[0].id).toBe('2');
      expect(sessions[1].id).toBe('1');
    });
  });

  describe('getSettings', () => {
    it('should return default settings when none exist', () => {
      const settings = getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should return stored settings merged with defaults', () => {
      const customSettings: UserSettings = {
        ...DEFAULT_SETTINGS,
        weeklyRepTarget: 100,
        name: 'Test User',
      };
      localStorage.setItem('highbeta_settings', JSON.stringify(customSettings));
      
      const settings = getSettings();
      expect(settings.weeklyRepTarget).toBe(100);
      expect(settings.name).toBe('Test User');
    });

    it('should handle corrupted settings data', () => {
      localStorage.setItem('highbeta_settings', 'invalid json');
      expect(getSettings()).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    it('should save settings', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        weeklyRepTarget: 75,
        dailyTimeGoalHours: 5,
      };
      
      saveSettings(settings);
      const stored = getSettings();
      
      expect(stored.weeklyRepTarget).toBe(75);
      expect(stored.dailyTimeGoalHours).toBe(5);
    });
  });

  describe('clearData', () => {
    it('should clear sessions', () => {
      const session: Session = {
        id: '1',
        timestamp: Date.now(),
        durationSeconds: 3600,
        reps: 5,
        notes: '',
        date: '2024-01-01',
      };
      saveSession(session);
      
      clearData();
      
      expect(getSessions()).toEqual([]);
    });

    it('should not clear settings', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        weeklyRepTarget: 75,
      };
      saveSettings(settings);
      
      clearData();
      
      expect(getSettings().weeklyRepTarget).toBe(75);
    });
  });

  describe('checkVersion', () => {
    it('should return false on first run', () => {
      expect(checkVersion()).toBe(false);
    });

    it('should return true when version matches', () => {
      localStorage.setItem('highbeta_version', CURRENT_VERSION);
      expect(checkVersion()).toBe(true);
    });

    it('should return false and update when version differs', () => {
      localStorage.setItem('highbeta_version', '0.9');
      expect(checkVersion()).toBe(false);
      expect(localStorage.getItem('highbeta_version')).toBe(CURRENT_VERSION);
    });
  });

  describe('exportDataJSON', () => {
    it('should export empty data correctly', () => {
      const json = exportDataJSON();
      const data = JSON.parse(json);
      
      expect(data.version).toBe(CURRENT_VERSION);
      expect(data.sessions).toEqual([]);
      expect(data.settings).toEqual(DEFAULT_SETTINGS);
      expect(data.timestamp).toBeTruthy();
    });

    it('should export data with sessions and settings', () => {
      const session: Session = {
        id: '1',
        timestamp: Date.now(),
        durationSeconds: 3600,
        reps: 5,
        notes: '',
        date: '2024-01-01',
      };
      saveSession(session);
      
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        weeklyRepTarget: 75,
      };
      saveSettings(settings);
      
      const json = exportDataJSON();
      const data = JSON.parse(json);
      
      expect(data.sessions).toHaveLength(1);
      expect(data.sessions[0].id).toBe('1');
      expect(data.settings.weeklyRepTarget).toBe(75);
    });
  });

  describe('importDataJSON', () => {
    it('should return false for invalid JSON', () => {
      expect(importDataJSON('invalid json')).toBe(false);
    });

    it('should return false for JSON missing sessions', () => {
      const invalidData = JSON.stringify({ version: CURRENT_VERSION });
      expect(importDataJSON(invalidData)).toBe(false);
    });

    it('should import valid data', () => {
      const exportData = {
        version: CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        sessions: [
          {
            id: '1',
            timestamp: Date.now(),
            durationSeconds: 3600,
            reps: 5,
            notes: 'Imported',
            date: '2024-01-01',
          },
        ],
        settings: {
          ...DEFAULT_SETTINGS,
          weeklyRepTarget: 100,
        },
      };
      
      const result = importDataJSON(JSON.stringify(exportData));
      
      expect(result).toBe(true);
      
      const sessions = getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].notes).toBe('Imported');
      
      const settings = getSettings();
      expect(settings.weeklyRepTarget).toBe(100);
    });

    it('should overwrite existing data', () => {
      // Save initial data
      const session1: Session = {
        id: 'old',
        timestamp: Date.now(),
        durationSeconds: 1800,
        reps: 2,
        notes: '',
        date: '2024-01-01',
      };
      saveSession(session1);
      
      // Import new data
      const exportData = {
        version: CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        sessions: [
          {
            id: 'new',
            timestamp: Date.now(),
            durationSeconds: 3600,
            reps: 5,
            notes: '',
            date: '2024-01-02',
          },
        ],
        settings: DEFAULT_SETTINGS,
      };
      
      importDataJSON(JSON.stringify(exportData));
      
      const sessions = getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('new');
    });
  });
});
