import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { Session, UserSettings } from '../types';

/**
 * Error types for Firebase sync operations
 */
export enum SyncErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Custom error class for sync operations
 */
export class SyncError extends Error {
  type: SyncErrorType;
  originalError?: any;
  
  constructor(message: string, type: SyncErrorType, originalError?: any) {
    super(message);
    this.name = 'SyncError';
    this.type = type;
    this.originalError = originalError;
  }
}

/**
 * Determines the error type from a Firebase error
 */
const classifyError = (error: any): SyncErrorType => {
  const code = error?.code || '';
  const message = error?.message || '';
  
  // Network-related errors
  if (code === 'unavailable' || message.includes('network') || message.includes('offline')) {
    return SyncErrorType.NETWORK_ERROR;
  }
  
  // Permission errors
  if (code === 'permission-denied' || code === 'unauthenticated') {
    return SyncErrorType.PERMISSION_ERROR;
  }
  
  // Quota errors
  if (code === 'resource-exhausted' || message.includes('quota')) {
    return SyncErrorType.QUOTA_EXCEEDED;
  }
  
  return SyncErrorType.UNKNOWN_ERROR;
};

/**
 * Creates a user-friendly error message based on error type
 */
export const getUserFriendlyErrorMessage = (errorType: SyncErrorType): string => {
  switch (errorType) {
    case SyncErrorType.NETWORK_ERROR:
      return 'Unable to sync. Please check your internet connection.';
    case SyncErrorType.PERMISSION_ERROR:
      return 'Sync permission denied. Please try signing in again.';
    case SyncErrorType.QUOTA_EXCEEDED:
      return 'Cloud storage quota exceeded. Please contact support.';
    case SyncErrorType.UNKNOWN_ERROR:
    default:
      return 'Sync failed. Your data is saved locally. We\'ll retry when you\'re back online.';
  }
};

/**
 * Retry logic configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

/**
 * Executes a function with retry logic
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxAttempts: number = RETRY_CONFIG.maxAttempts
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const errorType = classifyError(error);
      
      // Don't retry on permission errors
      if (errorType === SyncErrorType.PERMISSION_ERROR) {
        throw new SyncError(
          getUserFriendlyErrorMessage(errorType),
          errorType,
          error
        );
      }
      
      // Don't retry on quota errors
      if (errorType === SyncErrorType.QUOTA_EXCEEDED) {
        throw new SyncError(
          getUserFriendlyErrorMessage(errorType),
          errorType,
          error
        );
      }
      
      // If we've exhausted retries, throw
      if (attempt === maxAttempts) {
        throw new SyncError(
          getUserFriendlyErrorMessage(errorType),
          errorType,
          error
        );
      }
      
      // Calculate exponential backoff delay
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`${operationName} failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms...`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw lastError;
}

/**
 * Sync sessions to Firestore
 * Uploads all sessions with retry logic and error handling
 * 
 * @param userId - The user's unique ID
 * @param sessions - Array of sessions to sync
 * @throws {SyncError} If sync fails after retries
 */
export const syncSessionsToCloud = async (userId: string, sessions: Session[]): Promise<void> => {
  try {
    await withRetry(async () => {
      const sessionsRef = collection(db, `users/${userId}/sessions`);
      
      // Upload all sessions (batch operation for efficiency)
      const uploadPromises = sessions.map(session => 
        setDoc(doc(sessionsRef, session.id), session)
      );
      
      await Promise.all(uploadPromises);
    }, 'syncSessionsToCloud');
  } catch (error: any) {
    if (error instanceof SyncError) {
      throw error;
    }
    const errorType = classifyError(error);
    throw new SyncError(
      getUserFriendlyErrorMessage(errorType),
      errorType,
      error
    );
  }
};

/**
 * Get sessions from Firestore
 * Retrieves all sessions for a user with retry logic
 * 
 * @param userId - The user's unique ID
 * @returns Array of sessions sorted by timestamp (descending)
 * @throws {SyncError} If retrieval fails after retries
 */
export const getSessionsFromCloud = async (userId: string): Promise<Session[]> => {
  try {
    return await withRetry(async () => {
      const sessionsRef = collection(db, `users/${userId}/sessions`);
      const q = query(sessionsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => doc.data() as Session);
    }, 'getSessionsFromCloud');
  } catch (error: any) {
    if (error instanceof SyncError) {
      throw error;
    }
    const errorType = classifyError(error);
    throw new SyncError(
      getUserFriendlyErrorMessage(errorType),
      errorType,
      error
    );
  }
};

/**
 * Sync settings to Firestore
 * Uploads user settings with retry logic
 * 
 * @param userId - The user's unique ID
 * @param settings - User settings to sync
 * @throws {SyncError} If sync fails after retries
 */
export const syncSettingsToCloud = async (userId: string, settings: UserSettings): Promise<void> => {
  try {
    await withRetry(async () => {
      const settingsRef = doc(db, `users/${userId}/settings/current`);
      await setDoc(settingsRef, settings);
    }, 'syncSettingsToCloud');
  } catch (error: any) {
    if (error instanceof SyncError) {
      throw error;
    }
    const errorType = classifyError(error);
    throw new SyncError(
      getUserFriendlyErrorMessage(errorType),
      errorType,
      error
    );
  }
};

/**
 * Get settings from Firestore
 * Retrieves user settings with retry logic
 * 
 * @param userId - The user's unique ID
 * @returns User settings or null if not found
 * @throws {SyncError} If retrieval fails after retries
 */
export const getSettingsFromCloud = async (userId: string): Promise<UserSettings | null> => {
  try {
    return await withRetry(async () => {
      const settingsRef = doc(db, `users/${userId}/settings/current`);
      const snapshot = await getDoc(settingsRef);
      
      return snapshot.exists() ? snapshot.data() as UserSettings : null;
    }, 'getSettingsFromCloud');
  } catch (error: any) {
    if (error instanceof SyncError) {
      throw error;
    }
    const errorType = classifyError(error);
    throw new SyncError(
      getUserFriendlyErrorMessage(errorType),
      errorType,
      error
    );
  }
};

/**
 * Full sync: merge local and cloud data
 * This function implements a simple merge strategy:
 * - Sessions: Deduplicate by ID, keep all unique sessions
 * - Settings: Use cloud settings if available, otherwise use local
 * 
 * This operation is performed on initial sign-in to merge data from both sources
 * 
 * @param userId - The user's unique ID
 * @param localSessions - Sessions stored locally
 * @param localSettings - Settings stored locally
 * @returns Merged sessions and settings
 * @throws {SyncError} If sync fails after retries
 */
export const performFullSync = async (
  userId: string, 
  localSessions: Session[], 
  localSettings: UserSettings
): Promise<{ sessions: Session[], settings: UserSettings }> => {
  try {
    // Get cloud data with retry logic
    const [cloudSessions, cloudSettings] = await Promise.all([
      getSessionsFromCloud(userId),
      getSettingsFromCloud(userId)
    ]);

    // Merge sessions (deduplicate by ID, keep most recent based on timestamp)
    const sessionMap = new Map<string, Session>();
    [...localSessions, ...cloudSessions].forEach(session => {
      const existing = sessionMap.get(session.id);
      // Keep the session with the most recent timestamp
      if (!existing || session.timestamp > existing.timestamp) {
        sessionMap.set(session.id, session);
      }
    });
    const mergedSessions = Array.from(sessionMap.values())
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending

    // Use most recent settings (prefer cloud if available)
    const mergedSettings = cloudSettings || localSettings;

    // Upload merged data back to cloud with retry logic
    await Promise.all([
      syncSessionsToCloud(userId, mergedSessions),
      syncSettingsToCloud(userId, mergedSettings)
    ]);

    return { sessions: mergedSessions, settings: mergedSettings };
  } catch (error: any) {
    if (error instanceof SyncError) {
      throw error;
    }
    const errorType = classifyError(error);
    throw new SyncError(
      getUserFriendlyErrorMessage(errorType),
      errorType,
      error
    );
  }
};

/**
 * Sync a single session to cloud (for real-time sync after session complete)
 * This is called automatically when a new session is saved to localStorage
 * 
 * @param userId - The user's unique ID
 * @param session - Session to sync
 * @throws {SyncError} If sync fails after retries
 */
export const syncSingleSessionToCloud = async (userId: string, session: Session): Promise<void> => {
  try {
    await withRetry(async () => {
      const sessionRef = doc(db, `users/${userId}/sessions/${session.id}`);
      await setDoc(sessionRef, session);
    }, 'syncSingleSessionToCloud');
  } catch (error: any) {
    if (error instanceof SyncError) {
      throw error;
    }
    const errorType = classifyError(error);
    throw new SyncError(
      getUserFriendlyErrorMessage(errorType),
      errorType,
      error
    );
  }
};
