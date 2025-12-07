
export interface Session {
  id: string;
  timestamp: number; // Start time
  durationSeconds: number; // Actual Focus duration
  targetDurationSeconds?: number; // The committed time (Contract)
  reps: number; // "Reps" completed
  notes: string; // "Diagnostic Note" or log
  date: string; // ISO Date string YYYY-MM-DD
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

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  FOCUS = 'FOCUS',
  SETTINGS = 'SETTINGS'
}

export const DEFAULT_SETTINGS: UserSettings = {
  weeklyRepTarget: 50,
  dailyTimeGoalHours: 4,
  startDate: new Date().toISOString(),
  name: "D1 Economist",
  substanceFreeStartDate: new Date().toISOString(),
};
