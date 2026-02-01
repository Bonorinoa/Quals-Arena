
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

// Pre-defined goal categories
export type GoalCategoryId = 'problems' | 'tasks' | 'pomodoros' | 'pages' | 'custom';

export interface GoalCategory {
  id: GoalCategoryId;
  name: string;           // Display name (e.g., "Problems Solved")
  unit: string;           // Singular unit (e.g., "problem")
  unitPlural: string;     // Plural unit (e.g., "problems")
  icon?: string;          // Optional icon identifier
  description: string;    // Help text
}

export const DEFAULT_GOAL_CATEGORIES: GoalCategory[] = [
  {
    id: 'problems',
    name: 'Problems Solved',
    unit: 'problem',
    unitPlural: 'problems',
    description: 'Track exercises, problem sets, or practice questions completed'
  },
  {
    id: 'tasks',
    name: 'Tasks Completed',
    unit: 'task',
    unitPlural: 'tasks',
    description: 'Track to-do items or work tasks finished'
  },
  {
    id: 'pomodoros',
    name: 'Pomodoro Cycles',
    unit: 'pomodoro',
    unitPlural: 'pomodoros',
    description: 'Track focused work intervals (typically 25 minutes each)'
  },
  {
    id: 'pages',
    name: 'Pages Read/Written',
    unit: 'page',
    unitPlural: 'pages',
    description: 'Track reading or writing progress'
  },
  {
    id: 'custom',
    name: 'Custom',
    unit: 'unit',
    unitPlural: 'units',
    description: 'Define your own tracking unit'
  }
];

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
  goalCategoryId?: GoalCategoryId;     // What type of goal was tracked
  sessionGoalTarget?: number;          // Optional target for this session
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
  goalCategoryId?: GoalCategoryId;      // Selected goal category
  customGoalUnit?: string;              // Custom unit name (when goalCategoryId === 'custom')
  customGoalUnitPlural?: string;        // Custom plural unit name
  defaultSessionGoal?: number;          // Default target per session (optional)
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

export interface WeeklyReportSection {
  title: string;
  content: string | string[];
  highlight?: 'positive' | 'negative' | 'neutral';
  emoji?: string;
}

export interface WeeklyReport {
  id: string;
  generatedAt: number;
  weekStart: string;           // ISO date string (Monday)
  weekEnd: string;             // ISO date string (Sunday)
  
  // Summary Stats
  totalSessions: number;
  totalDuration: number;       // seconds
  totalGoalsCompleted: number; // reps using user's goal category
  activeDaysCount: number;
  
  // Budget Balance
  budgetBalance: {
    total: number;             // seconds (+ surplus, - deficit)
    dailyAverage: number;
    totalSurplus: number;
    totalDeficit: number;
  };
  
  // Performance Metrics
  metrics: {
    focusQuality?: number;     // %
    deepWorkRatio?: number;    // %
    consistency?: number;      // %
    avgSessionDuration?: number; // seconds
    budgetAdherence?: number;  // %
    ser?: number;              // SER value
  };
  
  // Behavioral Insights
  insights: {
    bestDay?: string;          // Day of week with highest output
    longestSession?: number;   // Duration in seconds
    mostProductiveTimeSlot?: string; // Morning/Afternoon/Evening
    pausePatterns?: {
      avgPausesPerSession: number;
      avgPauseTime: number;    // seconds
    };
  };
  
  // Templated Sections
  sections: WeeklyReportSection[];
  
  // Week-over-Week Comparison
  weekOverWeek?: {
    durationChange: number;    // percentage
    goalsChange: number;       // percentage
    balanceChange: number;     // seconds difference
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  weeklyRepTarget: 50,
  dailyTimeGoalHours: 4,
  startDate: new Date().toISOString(),
  name: "highBeta User",
  substanceFreeStartDate: new Date().toISOString(),
  theme: 'founder',
  activeDays: [1, 2, 3, 4, 5], // Monday-Friday by default
  enabledMetrics: ['focusQuality', 'deepWorkRatio', 'consistency'], // Default metrics
  goalCategoryId: 'problems',          // Default to "Problems Solved"
  defaultSessionGoal: undefined,       // No default session goal
};