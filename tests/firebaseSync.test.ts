import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  syncSessionsToCloud,
  getSessionsFromCloud,
  syncSettingsToCloud,
  getSettingsFromCloud,
  performFullSync,
  syncSingleSessionToCloud,
  SyncError,
  SyncErrorType,
  getUserFriendlyErrorMessage
} from '../services/firebaseSync';
import { Session, UserSettings, DEFAULT_SETTINGS } from '../types';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, path) => ({ path })),
  doc: vi.fn((db, path) => ({ path })),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((ref) => ref),
  orderBy: vi.fn(() => ({})),
}));

// Mock Firebase app
vi.mock('../services/firebase', () => ({
  db: {},
  auth: {},
  googleProvider: {},
}));

import * as firestore from 'firebase/firestore';

describe('firebaseSync', () => {
  const mockUserId = 'test-user-123';
  const mockSession: Session = {
    id: 'session-1',
    timestamp: Date.now(),
    durationSeconds: 3600,
    reps: 5,
    notes: 'Test session',
    date: '2024-01-01'
  };
  
  const mockSettings: UserSettings = {
    ...DEFAULT_SETTINGS,
    weeklyRepTarget: 75,
    name: 'Test User'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SyncError', () => {
    it('should create a SyncError with correct properties', () => {
      const error = new SyncError('Test error', SyncErrorType.NETWORK_ERROR, new Error('Original'));
      
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(SyncErrorType.NETWORK_ERROR);
      expect(error.name).toBe('SyncError');
      expect(error.originalError).toBeDefined();
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return correct message for network error', () => {
      const message = getUserFriendlyErrorMessage(SyncErrorType.NETWORK_ERROR);
      expect(message).toContain('internet connection');
    });

    it('should return correct message for permission error', () => {
      const message = getUserFriendlyErrorMessage(SyncErrorType.PERMISSION_ERROR);
      expect(message).toContain('permission denied');
    });

    it('should return correct message for quota error', () => {
      const message = getUserFriendlyErrorMessage(SyncErrorType.QUOTA_EXCEEDED);
      expect(message).toContain('quota exceeded');
    });

    it('should return default message for unknown error', () => {
      const message = getUserFriendlyErrorMessage(SyncErrorType.UNKNOWN_ERROR);
      expect(message).toContain('saved locally');
    });
  });

  describe('syncSessionsToCloud', () => {
    it('should successfully sync sessions', async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      await syncSessionsToCloud(mockUserId, [mockSession]);

      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should throw SyncError on failure', async () => {
      const error = new Error('Network error');
      (error as any).code = 'unavailable';
      vi.mocked(firestore.setDoc).mockRejectedValue(error);

      await expect(syncSessionsToCloud(mockUserId, [mockSession]))
        .rejects.toThrow(SyncError);
    });

    it('should retry on transient failures', async () => {
      let callCount = 0;
      vi.mocked(firestore.setDoc).mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          const error = new Error('Transient error');
          (error as any).code = 'unavailable';
          return Promise.reject(error);
        }
        return Promise.resolve(undefined);
      });

      await syncSessionsToCloud(mockUserId, [mockSession]);

      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('getSessionsFromCloud', () => {
    it('should retrieve sessions from cloud', async () => {
      const mockDocs = [
        { data: () => mockSession }
      ];
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const sessions = await getSessionsFromCloud(mockUserId);

      expect(sessions).toEqual([mockSession]);
      expect(firestore.getDocs).toHaveBeenCalled();
    });

    it('should throw SyncError on failure', async () => {
      const error = new Error('Permission denied');
      (error as any).code = 'permission-denied';
      vi.mocked(firestore.getDocs).mockRejectedValue(error);

      await expect(getSessionsFromCloud(mockUserId))
        .rejects.toThrow(SyncError);
    });
  });

  describe('syncSettingsToCloud', () => {
    it('should successfully sync settings', async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      await syncSettingsToCloud(mockUserId, mockSettings);

      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should throw SyncError on failure', async () => {
      const error = new Error('Network error');
      vi.mocked(firestore.setDoc).mockRejectedValue(error);

      await expect(syncSettingsToCloud(mockUserId, mockSettings))
        .rejects.toThrow(SyncError);
    });
  });

  describe('getSettingsFromCloud', () => {
    it('should retrieve settings from cloud', async () => {
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockSettings
      } as any);

      const settings = await getSettingsFromCloud(mockUserId);

      expect(settings).toEqual(mockSettings);
      expect(firestore.getDoc).toHaveBeenCalled();
    });

    it('should return null when settings do not exist', async () => {
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false,
        data: () => null
      } as any);

      const settings = await getSettingsFromCloud(mockUserId);

      expect(settings).toBeNull();
    });
  });

  describe('performFullSync', () => {
    const localSession1: Session = {
      id: 'local-1',
      timestamp: 1000,
      durationSeconds: 1800,
      reps: 3,
      notes: 'Local',
      date: '2024-01-01'
    };

    const localSession2: Session = {
      id: 'shared-1',
      timestamp: 2000,
      durationSeconds: 3600,
      reps: 5,
      notes: 'Local newer',
      date: '2024-01-02'
    };

    const cloudSession1: Session = {
      id: 'cloud-1',
      timestamp: 1500,
      durationSeconds: 2400,
      reps: 4,
      notes: 'Cloud',
      date: '2024-01-01'
    };

    const cloudSession2: Session = {
      id: 'shared-1',
      timestamp: 1800,
      durationSeconds: 3000,
      reps: 4,
      notes: 'Cloud older',
      date: '2024-01-02'
    };

    beforeEach(() => {
      // Mock getDocs for sessions
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: [
          { data: () => cloudSession1 },
          { data: () => cloudSession2 }
        ]
      } as any);

      // Mock getDoc for settings
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockSettings
      } as any);

      // Mock setDoc
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
    });

    it('should merge local and cloud sessions', async () => {
      const result = await performFullSync(
        mockUserId,
        [localSession1, localSession2],
        DEFAULT_SETTINGS
      );

      // Should have 3 unique sessions
      expect(result.sessions).toHaveLength(3);
      
      // Should have local-1, cloud-1, and shared-1 (with newer timestamp)
      const sessionIds = result.sessions.map(s => s.id);
      expect(sessionIds).toContain('local-1');
      expect(sessionIds).toContain('cloud-1');
      expect(sessionIds).toContain('shared-1');

      // For shared-1, should keep the one with newer timestamp (local)
      const sharedSession = result.sessions.find(s => s.id === 'shared-1');
      expect(sharedSession?.timestamp).toBe(2000);
      expect(sharedSession?.notes).toBe('Local newer');
    });

    it('should prefer cloud settings over local', async () => {
      const result = await performFullSync(
        mockUserId,
        [],
        DEFAULT_SETTINGS
      );

      expect(result.settings).toEqual(mockSettings);
    });

    it('should use local settings when cloud settings do not exist', async () => {
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false,
        data: () => null
      } as any);

      const localSettings = { ...DEFAULT_SETTINGS, weeklyRepTarget: 100 };
      const result = await performFullSync(
        mockUserId,
        [],
        localSettings
      );

      expect(result.settings).toEqual(localSettings);
    });

    it('should sort merged sessions by timestamp descending', async () => {
      const result = await performFullSync(
        mockUserId,
        [localSession1, localSession2],
        DEFAULT_SETTINGS
      );

      // First session should have the highest timestamp
      expect(result.sessions[0].timestamp).toBeGreaterThan(result.sessions[1].timestamp);
    });

    it('should upload merged data back to cloud', async () => {
      await performFullSync(
        mockUserId,
        [localSession1],
        DEFAULT_SETTINGS
      );

      // Should call setDoc for syncing sessions and settings
      expect(firestore.setDoc).toHaveBeenCalled();
    });
  });

  describe('syncSingleSessionToCloud', () => {
    it('should successfully sync a single session', async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      await syncSingleSessionToCloud(mockUserId, mockSession);

      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should throw SyncError on failure', async () => {
      const error = new Error('Network error');
      vi.mocked(firestore.setDoc).mockRejectedValue(error);

      await expect(syncSingleSessionToCloud(mockUserId, mockSession))
        .rejects.toThrow(SyncError);
    });
  });
});
