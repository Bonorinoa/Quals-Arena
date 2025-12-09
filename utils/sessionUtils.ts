/**
 * Utility functions for calculating session statistics
 */

import { Session } from '../types';

/**
 * Minimum duration threshold for calculating SER (in seconds)
 * Sessions below this threshold are considered "noise"
 */
export const MIN_DURATION_THRESHOLD_SECONDS = 300;

/**
 * Maximum surplus as proportion of commitment (50%)
 * This prevents gaming via systematic under-commitment while still rewarding overperformance
 * Example: 2h commitment -> max 1h surplus, 30m commitment -> max 15m surplus
 */
export const MAX_SURPLUS_RATIO = 0.5;

/**
 * Calculate total duration in seconds for a set of sessions
 * @param sessions - Array of sessions
 * @returns Total duration in seconds
 */
export const getTotalDuration = (sessions: Session[]): number => {
  return sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
};

/**
 * Calculate total reps for a set of sessions
 * @param sessions - Array of sessions
 * @returns Total reps
 */
export const getTotalReps = (sessions: Session[]): number => {
  return sessions.reduce((acc, s) => acc + s.reps, 0);
};

/**
 * Filter sessions by date
 * @param sessions - Array of sessions
 * @param date - Date string in YYYY-MM-DD format
 * @returns Filtered sessions
 */
export const getSessionsByDate = (sessions: Session[], date: string): Session[] => {
  return sessions.filter(s => s.date === date);
};

/**
 * Calculate Sober Efficiency Rate (SER)
 * @param reps - Total reps
 * @param durationSeconds - Total duration in seconds
 * @param minDuration - Minimum duration threshold (default: MIN_DURATION_THRESHOLD_SECONDS)
 * @returns SER value or 0 if below threshold
 */
export const calculateSER = (reps: number, durationSeconds: number, minDuration: number = MIN_DURATION_THRESHOLD_SECONDS): number => {
  if (durationSeconds <= minDuration) return 0;
  const hours = durationSeconds / 3600;
  return reps / hours;
};

/**
 * Calculate budget balance for a single session with proportional surplus cap
 * Positive = surplus (logged more than committed)
 * Negative = deficit (logged less than committed)
 * 
 * Surplus Cap: Surpluses are capped at 50% of the commitment to prevent gaming
 * via systematic under-commitment. Deficits are never capped.
 * 
 * @param session - Session to calculate balance for
 * @returns Balance in seconds (positive for surplus, negative for deficit), or 0 if no target was set
 * 
 * @example
 * // 2h commitment, 3h actual -> surplus capped at 1h (50% of 2h)
 * getSessionBudgetBalance({ targetDurationSeconds: 7200, durationSeconds: 10800 }) // returns 3600
 * 
 * @example
 * // 30m commitment, 2h actual -> surplus capped at 15m (50% of 30m)
 * getSessionBudgetBalance({ targetDurationSeconds: 1800, durationSeconds: 7200 }) // returns 900
 * 
 * @example
 * // Deficits are not capped
 * getSessionBudgetBalance({ targetDurationSeconds: 7200, durationSeconds: 3600 }) // returns -3600
 */
export const getSessionBudgetBalance = (session: Session): number => {
  // If no target was set, there's no deficit or surplus
  if (!session.targetDurationSeconds) {
    return 0;
  }
  
  const rawBalance = session.durationSeconds - session.targetDurationSeconds;
  
  // Only cap surpluses (positive balances), never deficits (negative balances)
  if (rawBalance > 0) {
    const maxSurplus = session.targetDurationSeconds * MAX_SURPLUS_RATIO;
    return Math.min(rawBalance, maxSurplus);
  }
  
  // Return deficit without cap
  return rawBalance;
};

/**
 * Calculate daily budget balance (sum of all session balances for a day)
 * @param sessions - Array of sessions for a specific day
 * @returns Daily balance in seconds (positive for surplus, negative for deficit)
 */
export const getDailyBudgetBalance = (sessions: Session[]): number => {
  return sessions.reduce((acc, s) => acc + getSessionBudgetBalance(s), 0);
};

/**
 * Calculate weekly budget balance statistics
 * @param sessions - Array of sessions
 * @param startDate - Start of the week (Date object)
 * @param endDate - End of the week (Date object)
 * @returns Object containing total balance, average daily balance, surplus and deficit totals
 */
export const getWeeklyBudgetBalance = (
  sessions: Session[],
  startDate: Date,
  endDate: Date
): {
  totalBalance: number;
  averageDailyBalance: number;
  totalSurplus: number;
  totalDeficit: number;
  daysWithSessions: number;
} => {
  // Filter sessions within the date range
  const weekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= startDate && sessionDate <= endDate;
  });

  // Calculate total balance
  const totalBalance = weekSessions.reduce(
    (acc, s) => acc + getSessionBudgetBalance(s),
    0
  );

  // Calculate surplus and deficit separately
  const totalSurplus = weekSessions.reduce((acc, s) => {
    const balance = getSessionBudgetBalance(s);
    return balance > 0 ? acc + balance : acc;
  }, 0);

  const totalDeficit = weekSessions.reduce((acc, s) => {
    const balance = getSessionBudgetBalance(s);
    return balance < 0 ? acc + balance : acc;
  }, 0);

  // Get unique dates with sessions
  const uniqueDates = new Set(weekSessions.map(s => s.date));
  const daysWithSessions = uniqueDates.size;

  // Calculate average (over the full 7-day period, not just days with sessions)
  // For a standard week, this should be 7 days
  const daysInPeriod = 7;
  const averageDailyBalance = totalBalance / daysInPeriod;

  return {
    totalBalance,
    averageDailyBalance,
    totalSurplus,
    totalDeficit,
    daysWithSessions,
  };
};

/**
 * Analyze commitment patterns to detect potential gaming behavior
 * This is a non-punitive behavioral nudge to educate users about their patterns
 * 
 * @param sessions - Array of sessions to analyze
 * @returns Object containing pattern analysis statistics
 * 
 * @example
 * // User with consistent high commitments
 * analyzeCommitmentPatterns(sessions) // { averageCommitment: 7200, minimumCommitmentRatio: 0.1, hasLowCommitmentPattern: false }
 * 
 * @example
 * // User gaming with minimum commitments
 * analyzeCommitmentPatterns(sessions) // { averageCommitment: 2100, minimumCommitmentRatio: 0.8, hasLowCommitmentPattern: true }
 */
export const analyzeCommitmentPatterns = (sessions: Session[]): {
  averageCommitment: number;
  minimumCommitmentRatio: number;
  hasLowCommitmentPattern: boolean;
} => {
  if (sessions.length === 0) {
    return { 
      averageCommitment: 0, 
      minimumCommitmentRatio: 0, 
      hasLowCommitmentPattern: false 
    };
  }

  const MIN_COMMITMENT = 30 * 60; // 30 minutes in seconds
  const LOW_PATTERN_THRESHOLD = 0.7; // 70% minimum commitment sessions
  const MIN_SESSIONS_FOR_PATTERN = 10; // Need at least 10 sessions to detect pattern
  
  const sessionsWithCommitment = sessions.filter(s => s.targetDurationSeconds);
  
  if (sessionsWithCommitment.length === 0) {
    return { 
      averageCommitment: 0, 
      minimumCommitmentRatio: 0, 
      hasLowCommitmentPattern: false 
    };
  }

  // Calculate average commitment
  const totalCommitment = sessionsWithCommitment.reduce(
    (sum, s) => sum + (s.targetDurationSeconds || 0), 
    0
  );
  const averageCommitment = totalCommitment / sessionsWithCommitment.length;

  // Calculate ratio of minimum commitment sessions
  const minCommitmentCount = sessionsWithCommitment.filter(
    s => s.targetDurationSeconds === MIN_COMMITMENT
  ).length;
  const minimumCommitmentRatio = minCommitmentCount / sessionsWithCommitment.length;

  // Flag pattern if 70%+ sessions are minimum commitment AND user has 10+ sessions
  const hasLowCommitmentPattern = 
    minimumCommitmentRatio > LOW_PATTERN_THRESHOLD && 
    sessionsWithCommitment.length >= MIN_SESSIONS_FOR_PATTERN;

  return {
    averageCommitment,
    minimumCommitmentRatio,
    hasLowCommitmentPattern,
  };
};
