/**
 * Utility functions for calculating session statistics
 */

import { Session } from '../types';

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
 * @param minDuration - Minimum duration threshold (default: 300 seconds)
 * @returns SER value or 0 if below threshold
 */
export const calculateSER = (reps: number, durationSeconds: number, minDuration: number = 300): number => {
  if (durationSeconds <= minDuration) return 0;
  const hours = durationSeconds / 3600;
  return reps / hours;
};
