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
 * Calculate budget balance for a single session
 * Positive = surplus (logged more than committed)
 * Negative = deficit (logged less than committed)
 * @param session - Session to calculate balance for
 * @returns Balance in seconds (positive for surplus, negative for deficit)
 */
export const getSessionBudgetBalance = (session: Session): number => {
  const target = session.targetDurationSeconds ?? session.durationSeconds;
  return session.durationSeconds - target;
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
  const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const averageDailyBalance = daysInPeriod > 0 ? totalBalance / daysInPeriod : 0;

  return {
    totalBalance,
    averageDailyBalance,
    totalSurplus,
    totalDeficit,
    daysWithSessions,
  };
};
