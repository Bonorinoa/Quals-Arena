
export interface MentalNote {
  timestamp: number; // Seconds relative to session start
  text: string;
}

export interface Session {
  id: string;
  timestamp: number; // Start time
  durationSeconds: number; // Actual Focus duration
  targetDurationSeconds?: number; // The committed time (Contract)
  reps: number; // "Reps" completed
  notes: string; // "Diagnostic Note" or log
  mentalNotes?: MentalNote[]; // The Stream of Consciousness
  date: string; // ISO Date string YYYY-MM-DD
  lastModified?: number; // Timestamp of last edit
  editCount?: number; // Number of times edited
  deleted?: boolean; // Soft delete flag
}

export interface UserSettings {
  weeklyRepTarget: number;
  dailyTimeGoalHours: number; // Daily Deep Work Goal (e.g., 4 hours)
  startDate: string; // When the protocol started
  name: string;
  substanceFreeStartDate: string;
}

export interface DailyStats {
  date: string;
  totalDuration: number;
  totalReps: number;
  ser: number; // Sober Efficiency Rate (Reps / Hour)
}

export interface SyncQueueItem {
  id: string;
  session: Session;
  status: 'PENDING' | 'FAILED';
  retryCount: number;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  FOCUS = 'FOCUS',
  SETTINGS = 'SETTINGS'
}

export const DEFAULT_SETTINGS: UserSettings = {
  weeklyRepTarget: 50,
  dailyTimeGoalHours: 4,
  startDate: new Date().toISOString(),
  name: "highBeta User",
  substanceFreeStartDate: new Date().toISOString()
};