
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
  googleSheetsUrl?: string; // Webhook URL for Google Apps Script
}

export interface DailyStats {
  date: string;
  totalDuration: number;
  totalReps: number;
  ser: number; // Sober Efficiency Rate (Reps / Hour)
  netPositionSeconds: number; // Net Position for the day (actual - committed)
}

export interface NetPositionMetrics {
  todayNetPositionSeconds: number;
  weeklyNetPositionSeconds: number;
  weeklyAverageNetPositionSeconds: number;
  fridayNetPositionSeconds: number; // For Saturday unlock check
  isSaturdayUnlocked: boolean; // Based on Friday's average
  totalOwedSeconds: number; // Total deficit for penalty calculation
}

export interface PenaltyCalculation {
  totalMinutesOwed: number;
  penaltyAmount: number; // Mock amount in dollars
  description: string;
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
  name: "HighBeta User",
  substanceFreeStartDate: new Date().toISOString(),
  googleSheetsUrl: ""
};
