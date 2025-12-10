import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { Session, UserSettings } from '../types';

/**
 * Sync sessions to Firestore
 */
export const syncSessionsToCloud = async (userId: string, sessions: Session[]): Promise<void> => {
  const sessionsRef = collection(db, `users/${userId}/sessions`);
  
  // Upload all sessions (batch operation for efficiency)
  const uploadPromises = sessions.map(session => 
    setDoc(doc(sessionsRef, session.id), session)
  );
  
  await Promise.all(uploadPromises);
};

/**
 * Get sessions from Firestore
 */
export const getSessionsFromCloud = async (userId: string): Promise<Session[]> => {
  const sessionsRef = collection(db, `users/${userId}/sessions`);
  const q = query(sessionsRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as Session);
};

/**
 * Sync settings to Firestore
 */
export const syncSettingsToCloud = async (userId: string, settings: UserSettings): Promise<void> => {
  const settingsRef = doc(db, `users/${userId}/settings/current`);
  await setDoc(settingsRef, settings);
};

/**
 * Get settings from Firestore
 */
export const getSettingsFromCloud = async (userId: string): Promise<UserSettings | null> => {
  const settingsRef = doc(db, `users/${userId}/settings/current`);
  const snapshot = await getDoc(settingsRef);
  
  return snapshot.exists() ? snapshot.data() as UserSettings : null;
};

/**
 * Full sync: merge local and cloud data
 * This function implements a simple merge strategy:
 * - Sessions: Deduplicate by ID, keep all unique sessions
 * - Settings: Use cloud settings if available, otherwise use local
 */
export const performFullSync = async (
  userId: string, 
  localSessions: Session[], 
  localSettings: UserSettings
): Promise<{ sessions: Session[], settings: UserSettings }> => {
  // Get cloud data
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

  // Upload merged data back to cloud
  await Promise.all([
    syncSessionsToCloud(userId, mergedSessions),
    syncSettingsToCloud(userId, mergedSettings)
  ]);

  return { sessions: mergedSessions, settings: mergedSettings };
};

/**
 * Sync a single session to cloud (for real-time sync after session complete)
 */
export const syncSingleSessionToCloud = async (userId: string, session: Session): Promise<void> => {
  const sessionRef = doc(db, `users/${userId}/sessions/${session.id}`);
  await setDoc(sessionRef, session);
};
