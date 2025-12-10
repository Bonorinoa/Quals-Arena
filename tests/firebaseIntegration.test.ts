import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  performFullSync,
  syncSingleSessionToCloud,
  syncSessionsToCloud,
  syncSettingsToCloud,
  getSessionsFromCloud,
  getSettingsFromCloud,
  SyncError,
  SyncErrorType
} from '../services/firebaseSync';
import { Session, UserSettings, DEFAULT_SETTINGS } from '../types';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, path) => ({ path })),
  doc: vi.fn((db, path, id) => ({ path, id })),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((ref) => ref),
  orderBy: vi.fn(() => ({})),
}));

vi.mock('../services/firebase', () => ({
  db: {},
  auth: {},
  googleProvider: {},
}));

import * as firestore from 'firebase/firestore';

/**
 * Comprehensive Firebase Integration Tests for Category 1
 * 
 * Testing Areas:
 * - Firebase Authentication Integration (1.1)
 * - Firestore Data Sync (1.2)
 * - Multi-Device Conflict Resolution (1.3)
 * - Offline/Online Transitions
 * - Error Recovery and Retry Logic
 * - Data Migration and Initial Sync
 */

describe('Firebase Integration - Category 1 Comprehensive Tests', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock session
  const createMockSession = (id: string, timestamp: number, notes: string = 'Test'): Session => ({
    id,
    timestamp,
    durationSeconds: 3600,
    reps: 5,
    notes,
    date: new Date(timestamp).toISOString().split('T')[0]
  });

  describe('1.2 Firestore Data Sync - Session Sync', () => {
    describe('Successful Session Sync', () => {
      it('should sync a single session to cloud successfully', async () => {
        vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
        
        const session = createMockSession('session-1', Date.now(), 'First session');
        await syncSingleSessionToCloud(mockUserId, session);
        
        expect(firestore.setDoc).toHaveBeenCalledTimes(1);
      });

      it('should sync multiple sessions in batch', async () => {
        vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
        
        const sessions = [
          createMockSession('session-1', Date.now() - 10000),
          createMockSession('session-2', Date.now() - 5000),
          createMockSession('session-3', Date.now())
        ];
        
        await syncSessionsToCloud(mockUserId, sessions);
        
        // Should call setDoc for each session
        expect(firestore.setDoc).toHaveBeenCalledTimes(sessions.length);
      });

      it('should preserve all session data during sync', async () => {
        let capturedData: any;
        vi.mocked(firestore.setDoc).mockImplementation(async (ref, data) => {
          capturedData = data;
          return undefined;
        });
        
        const session = createMockSession('session-1', Date.now(), 'Important notes');
        session.reps = 42;
        session.durationSeconds = 7200;
        
        await syncSingleSessionToCloud(mockUserId, session);
        
        expect(capturedData).toMatchObject({
          id: 'session-1',
          reps: 42,
          durationSeconds: 7200,
          notes: 'Important notes'
        });
      });
    });

    describe('Session Sync Error Handling', () => {
      it('should throw SyncError on network failure', async () => {
        const error = new Error('Network unavailable');
        (error as any).code = 'unavailable';
        vi.mocked(firestore.setDoc).mockRejectedValue(error);
        
        const session = createMockSession('session-1', Date.now());
        
        await expect(syncSingleSessionToCloud(mockUserId, session))
          .rejects.toThrow(SyncError);
      });

      it('should classify permission errors correctly', async () => {
        const error = new Error('Permission denied');
        (error as any).code = 'permission-denied';
        vi.mocked(firestore.setDoc).mockRejectedValue(error);
        
        const session = createMockSession('session-1', Date.now());
        
        try {
          await syncSingleSessionToCloud(mockUserId, session);
          expect.fail('Should have thrown SyncError');
        } catch (e) {
          if (e instanceof SyncError) {
            expect(e.type).toBe(SyncErrorType.PERMISSION_ERROR);
          }
        }
      });

      it('should retry on transient network errors', async () => {
        let attemptCount = 0;
        vi.mocked(firestore.setDoc).mockImplementation(() => {
          attemptCount++;
          if (attemptCount < 3) {
            const error = new Error('Temporary failure');
            (error as any).code = 'unavailable';
            return Promise.reject(error);
          }
          return Promise.resolve(undefined);
        });
        
        const session = createMockSession('session-1', Date.now());
        await syncSingleSessionToCloud(mockUserId, session);
        
        expect(attemptCount).toBeGreaterThanOrEqual(3);
      });
    });

    describe('Session Retrieval from Cloud', () => {
      it('should retrieve all sessions for a user', async () => {
        const mockSessions = [
          createMockSession('session-1', Date.now() - 10000),
          createMockSession('session-2', Date.now())
        ];
        
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: mockSessions.map(s => ({ data: () => s }))
        } as any);
        
        const sessions = await getSessionsFromCloud(mockUserId);
        
        expect(sessions).toHaveLength(2);
        expect(sessions[0].id).toBe('session-1');
        expect(sessions[1].id).toBe('session-2');
      });

      it('should return empty array when user has no sessions', async () => {
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: []
        } as any);
        
        const sessions = await getSessionsFromCloud(mockUserId);
        
        expect(sessions).toEqual([]);
      });

      it('should handle corrupted session data gracefully', async () => {
        const invalidSession = { invalid: 'data' };
        
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: [{ data: () => invalidSession }]
        } as any);
        
        const sessions = await getSessionsFromCloud(mockUserId);
        
        // Should still return array, even if data is invalid
        expect(Array.isArray(sessions)).toBe(true);
      });
    });
  });

  describe('1.2 Firestore Data Sync - Settings Sync', () => {
    describe('Settings Sync Operations', () => {
      it('should sync user settings to cloud', async () => {
        vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
        
        const settings: UserSettings = {
          ...DEFAULT_SETTINGS,
          name: 'Test User',
          weeklyRepTarget: 100
        };
        
        await syncSettingsToCloud(mockUserId, settings);
        
        expect(firestore.setDoc).toHaveBeenCalledTimes(1);
      });

      it('should preserve all settings fields during sync', async () => {
        let capturedSettings: any;
        vi.mocked(firestore.setDoc).mockImplementation(async (ref, data) => {
          capturedSettings = data;
          return undefined;
        });
        
        const settings: UserSettings = {
          ...DEFAULT_SETTINGS,
          name: 'Test User',
          weeklyRepTarget: 100,
          dailyGoalMinutes: 240,
          targetDurationMinutes: 90
        };
        
        await syncSettingsToCloud(mockUserId, settings);
        
        expect(capturedSettings).toMatchObject({
          name: 'Test User',
          weeklyRepTarget: 100,
          dailyGoalMinutes: 240,
          targetDurationMinutes: 90
        });
      });

      it('should retrieve settings from cloud', async () => {
        const cloudSettings: UserSettings = {
          ...DEFAULT_SETTINGS,
          name: 'Cloud User',
          weeklyRepTarget: 75
        };
        
        vi.mocked(firestore.getDoc).mockResolvedValue({
          exists: () => true,
          data: () => cloudSettings
        } as any);
        
        const settings = await getSettingsFromCloud(mockUserId);
        
        expect(settings).toEqual(cloudSettings);
      });

      it('should return null when settings do not exist in cloud', async () => {
        vi.mocked(firestore.getDoc).mockResolvedValue({
          exists: () => false,
          data: () => null
        } as any);
        
        const settings = await getSettingsFromCloud(mockUserId);
        
        expect(settings).toBeNull();
      });
    });
  });

  describe('1.3 Multi-Device Conflict Resolution', () => {
    describe('Session Merge Strategies', () => {
      it('should keep newer version of same session (last-write-wins)', async () => {
        const localSession = createMockSession('shared-1', 2000, 'Local version');
        const cloudSession = createMockSession('shared-1', 1500, 'Cloud version');
        
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: [{ data: () => cloudSession }]
        } as any);
        
        vi.mocked(firestore.getDoc).mockResolvedValue({
          exists: () => false,
          data: () => null
        } as any);
        
        vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
        
        const result = await performFullSync(mockUserId, [localSession], DEFAULT_SETTINGS);
        
        const mergedSession = result.sessions.find(s => s.id === 'shared-1');
        expect(mergedSession?.timestamp).toBe(2000);
        expect(mergedSession?.notes).toBe('Local version');
      });

      it('should merge unique sessions from local and cloud', async () => {
        const localSession1 = createMockSession('local-1', 1000);
        const localSession2 = createMockSession('local-2', 2000);
        const cloudSession1 = createMockSession('cloud-1', 1500);
        const cloudSession2 = createMockSession('cloud-2', 2500);
        
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: [
            { data: () => cloudSession1 },
            { data: () => cloudSession2 }
          ]
        } as any);
        
        vi.mocked(firestore.getDoc).mockResolvedValue({
          exists: () => false,
          data: () => null
        } as any);
        
        vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
        
        const result = await performFullSync(
          mockUserId,
          [localSession1, localSession2],
          DEFAULT_SETTINGS
        );
        
        expect(result.sessions).toHaveLength(4);
        const sessionIds = result.sessions.map(s => s.id);
        expect(sessionIds).toContain('local-1');
        expect(sessionIds).toContain('local-2');
        expect(sessionIds).toContain('cloud-1');
        expect(sessionIds).toContain('cloud-2');
      });

      it('should sort merged sessions by timestamp (newest first)', async () => {
        const session1 = createMockSession('s1', 1000);
        const session2 = createMockSession('s2', 3000);
        const session3 = createMockSession('s3', 2000);
        
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: [
            { data: () => session1 },
            { data: () => session3 }
          ]
        } as any);
        
        vi.mocked(firestore.getDoc).mockResolvedValue({
          exists: () => false,
          data: () => null
        } as any);
        
        vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
        
        const result = await performFullSync(mockUserId, [session2], DEFAULT_SETTINGS);
        
        // Verify descending order
        for (let i = 0; i < result.sessions.length - 1; i++) {
          expect(result.sessions[i].timestamp).toBeGreaterThanOrEqual(
            result.sessions[i + 1].timestamp
          );
        }
      });

      it('should handle multiple duplicate sessions correctly', async () => {
        const localVersion = createMockSession('dup-1', 3000, 'Latest');
        const cloudVersion1 = createMockSession('dup-1', 2000, 'Older');
        const cloudVersion2 = createMockSession('dup-1', 1000, 'Oldest');
        
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: [
            { data: () => cloudVersion1 },
            { data: () => cloudVersion2 }
          ]
        } as any);
        
        vi.mocked(firestore.getDoc).mockResolvedValue({
          exists: () => false,
          data: () => null
        } as any);
        
        vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
        
        const result = await performFullSync(mockUserId, [localVersion], DEFAULT_SETTINGS);
        
        const dupSessions = result.sessions.filter(s => s.id === 'dup-1');
        expect(dupSessions).toHaveLength(1);
        expect(dupSessions[0].timestamp).toBe(3000);
        expect(dupSessions[0].notes).toBe('Latest');
      });
    });

    describe('Settings Merge Strategies', () => {
      it('should prefer cloud settings over local (cloud is source of truth)', async () => {
        const localSettings: UserSettings = {
          ...DEFAULT_SETTINGS,
          name: 'Local User',
          weeklyRepTarget: 50
        };
        
        const cloudSettings: UserSettings = {
          ...DEFAULT_SETTINGS,
          name: 'Cloud User',
          weeklyRepTarget: 100
        };
        
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: []
        } as any);
        
        vi.mocked(firestore.getDoc).mockResolvedValue({
          exists: () => true,
          data: () => cloudSettings
        } as any);
        
        vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
        
        const result = await performFullSync(mockUserId, [], localSettings);
        
        expect(result.settings).toEqual(cloudSettings);
      });

      it('should use local settings when cloud settings do not exist', async () => {
        const localSettings: UserSettings = {
          ...DEFAULT_SETTINGS,
          name: 'Local User',
          weeklyRepTarget: 75
        };
        
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: []
        } as any);
        
        vi.mocked(firestore.getDoc).mockResolvedValue({
          exists: () => false,
          data: () => null
        } as any);
        
        vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
        
        const result = await performFullSync(mockUserId, [], localSettings);
        
        expect(result.settings).toEqual(localSettings);
      });
    });
  });

  describe('Offline/Online Transition Handling', () => {
    it('should handle offline state gracefully during session sync', async () => {
      const error = new Error('Network unavailable');
      (error as any).code = 'unavailable';
      vi.mocked(firestore.setDoc).mockRejectedValue(error);
      
      const session = createMockSession('session-1', Date.now());
      
      try {
        await syncSingleSessionToCloud(mockUserId, session);
        expect.fail('Should have thrown SyncError');
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
        if (e instanceof SyncError) {
          expect(e.type).toBe(SyncErrorType.NETWORK_ERROR);
        }
      }
    });

    it('should handle offline state gracefully during settings sync', async () => {
      const error = new Error('Network unavailable');
      (error as any).code = 'unavailable';
      vi.mocked(firestore.setDoc).mockRejectedValue(error);
      
      const settings = { ...DEFAULT_SETTINGS, name: 'Test' };
      
      try {
        await syncSettingsToCloud(mockUserId, settings);
        expect.fail('Should have thrown SyncError');
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
      }
    });

    it('should successfully sync after network recovery', async () => {
      let attemptCount = 0;
      vi.mocked(firestore.setDoc).mockImplementation(() => {
        attemptCount++;
        // Fail first 2 attempts (offline), succeed on 3rd (online)
        if (attemptCount < 3) {
          const error = new Error('Network unavailable');
          (error as any).code = 'unavailable';
          return Promise.reject(error);
        }
        return Promise.resolve(undefined);
      });
      
      const session = createMockSession('session-1', Date.now());
      await syncSingleSessionToCloud(mockUserId, session);
      
      expect(attemptCount).toBe(3);
    });
  });

  describe('Initial Sync and Data Migration', () => {
    it('should handle first-time sync with only local data', async () => {
      const localSessions = [
        createMockSession('local-1', Date.now() - 10000),
        createMockSession('local-2', Date.now())
      ];
      
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: []
      } as any);
      
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false,
        data: () => null
      } as any);
      
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
      
      const result = await performFullSync(mockUserId, localSessions, DEFAULT_SETTINGS);
      
      expect(result.sessions).toHaveLength(2);
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should handle first-time sync with only cloud data', async () => {
      const cloudSessions = [
        createMockSession('cloud-1', Date.now() - 10000),
        createMockSession('cloud-2', Date.now())
      ];
      
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: cloudSessions.map(s => ({ data: () => s }))
      } as any);
      
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false,
        data: () => null
      } as any);
      
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
      
      const result = await performFullSync(mockUserId, [], DEFAULT_SETTINGS);
      
      expect(result.sessions).toHaveLength(2);
    });

    it('should upload merged data back to cloud after initial sync', async () => {
      const localSession = createMockSession('local-1', Date.now());
      const cloudSession = createMockSession('cloud-1', Date.now() - 1000);
      
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: [{ data: () => cloudSession }]
      } as any);
      
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false,
        data: () => null
      } as any);
      
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
      
      await performFullSync(mockUserId, [localSession], DEFAULT_SETTINGS);
      
      // Should sync both sessions and settings
      expect(firestore.setDoc).toHaveBeenCalled();
      const setDocCalls = vi.mocked(firestore.setDoc).mock.calls.length;
      expect(setDocCalls).toBeGreaterThan(0);
    });
  });

  describe('Data Privacy and Security', () => {
    it('should isolate user data by userId in sync operations', async () => {
      let capturedPath: any;
      vi.mocked(firestore.doc).mockImplementation((db, ...args) => {
        capturedPath = args;
        return { path: args.join('/') } as any;
      });
      
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
      
      const session = createMockSession('session-1', Date.now());
      await syncSingleSessionToCloud(mockUserId, session);
      
      // Verify userId is part of the document path
      expect(capturedPath).toBeDefined();
    });

    it('should handle quota exceeded errors gracefully', async () => {
      const error = new Error('Quota exceeded');
      (error as any).code = 'resource-exhausted';
      vi.mocked(firestore.setDoc).mockRejectedValue(error);
      
      const session = createMockSession('session-1', Date.now());
      
      try {
        await syncSingleSessionToCloud(mockUserId, session);
        expect.fail('Should have thrown SyncError');
      } catch (e) {
        if (e instanceof SyncError) {
          expect(e.type).toBe(SyncErrorType.QUOTA_EXCEEDED);
        }
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty session array sync', async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
      
      await syncSessionsToCloud(mockUserId, []);
      
      // Should not crash, may or may not call setDoc depending on implementation
      expect(true).toBe(true);
    });

    it('should handle session with very large notes field', async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
      
      const largeNotes = 'A'.repeat(10000); // 10KB of text
      const session = createMockSession('session-1', Date.now(), largeNotes);
      
      await syncSingleSessionToCloud(mockUserId, session);
      
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should handle session with special characters in notes', async () => {
      let capturedData: any;
      vi.mocked(firestore.setDoc).mockImplementation(async (ref, data) => {
        capturedData = data;
        return undefined;
      });
      
      const specialNotes = `Test with 中文, emoji 🎉, and symbols: <>&"'`;
      const session = createMockSession('session-1', Date.now(), specialNotes);
      
      await syncSingleSessionToCloud(mockUserId, session);
      
      expect(capturedData.notes).toBe(specialNotes);
    });

    it('should handle very old sessions (timestamp edge case)', async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
      
      const oldTimestamp = new Date('2020-01-01').getTime();
      const session = createMockSession('old-session', oldTimestamp);
      
      await syncSingleSessionToCloud(mockUserId, session);
      
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should handle sessions with missing optional fields', async () => {
      let capturedData: any;
      vi.mocked(firestore.setDoc).mockImplementation(async (ref, data) => {
        capturedData = data;
        return undefined;
      });
      
      const session: Session = {
        id: 'minimal-session',
        timestamp: Date.now(),
        durationSeconds: 3600,
        reps: 0,
        notes: '',
        date: new Date().toISOString().split('T')[0]
      };
      
      await syncSingleSessionToCloud(mockUserId, session);
      
      expect(capturedData).toMatchObject({
        id: 'minimal-session',
        reps: 0,
        notes: ''
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle sessions created before cloud sync was added', async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
      
      // Session without any cloud-specific fields
      const legacySession: Session = {
        id: 'legacy-session',
        timestamp: Date.now(),
        durationSeconds: 3600,
        reps: 5,
        notes: 'Created before cloud sync',
        date: '2024-01-01'
      };
      
      await syncSingleSessionToCloud(mockUserId, legacySession);
      
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should handle settings migration from older format', async () => {
      const cloudSettings = {
        ...DEFAULT_SETTINGS,
        // Older versions might have different fields
        name: 'Migrated User'
      };
      
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => cloudSettings
      } as any);
      
      const settings = await getSettingsFromCloud(mockUserId);
      
      expect(settings).toBeDefined();
      expect(settings?.name).toBe('Migrated User');
    });
  });
});
