
export interface MentalNote {
  timestamp: number; // Seconds relative to session start
  text: string;
}

export interface PauseEvent {
  pausedAt: number;      // Timestamp when paused
  resumedAt?: number;    // Timestamp when resumed (undefined if still paused)
  elapsedAtPause: number; // Seconds elapsed when pause was triggered
  pauseDuration?: number; // Calculated duration of pause in seconds
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
  pauseEvents?: PauseEvent[];   // Array of pause/resume events
  totalPauseTime?: number;      // Total seconds spent paused
  pauseCount?: number;          // Number of times paused
}

export type ThemeName = 'founder' | 'calm';

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  value?: number;
  unit?: string;
  format?: 'percentage' | 'number' | 'time';
}

export interface UserSettings {
  weeklyRepTarget: number;
  dailyTimeGoalHours: number; // Daily Deep Work Goal (e.g., 4 hours)
  startDate: string; // When the protocol started
  name: string;
  substanceFreeStartDate: string;
  theme?: ThemeName; // Color theme preference
  activeDays?: number[]; // Days of week where daily goal applies (0=Sunday, 6=Saturday)
  enabledMetrics?: string[]; // IDs of metrics to display
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
  substanceFreeStartDate: new Date().toISOString(),
  theme: 'founder',
  activeDays: [1, 2, 3, 4, 5], // Monday-Friday by default
  enabledMetrics: ['focusQuality', 'deepWorkRatio', 'consistency'] // Default metrics
};