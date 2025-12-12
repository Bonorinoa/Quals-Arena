/**
 * Custom Metrics Calculation
 * 
 * Process-oriented metrics for data-oriented users.
 * Designed to inform without over-gamification.
 */

import { Session, CustomMetric } from '../types';
import { getSessionBudgetBalance } from './sessionUtils';

/**
 * Calculate Focus Quality Score
 * Measures how well users commit to their original target
 * Formula: Average completion percentage (actual / target)
 */
export const calculateFocusQuality = (sessions: Session[]): CustomMetric => {
  const sessionsWithTarget = sessions.filter(s => s.targetDurationSeconds && s.targetDurationSeconds > 0);
  
  if (sessionsWithTarget.length === 0) {
    return {
      id: 'focusQuality',
      name: 'Focus Quality',
      description: 'Average commitment completion rate',
      value: undefined,
      unit: '%',
      format: 'percentage'
    };
  }
  
  const completionRates = sessionsWithTarget.map(s => {
    const rate = (s.durationSeconds / (s.targetDurationSeconds || 1)) * 100;
    // Cap at 100% to prevent overcommitment from inflating score
    return Math.min(rate, 100);
  });
  
  const avgCompletion = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
  
  return {
    id: 'focusQuality',
    name: 'Focus Quality',
    description: 'Average commitment completion rate',
    value: Math.round(avgCompletion),
    unit: '%',
    format: 'percentage'
  };
};

/**
 * Calculate Deep Work Ratio
 * Percentage of sessions that are >= 60 minutes
 * Encourages longer, more focused sessions
 */
export const calculateDeepWorkRatio = (sessions: Session[]): CustomMetric => {
  if (sessions.length === 0) {
    return {
      id: 'deepWorkRatio',
      name: 'Deep Work Ratio',
      description: 'Sessions ≥60min / Total sessions',
      value: undefined,
      unit: '%',
      format: 'percentage'
    };
  }
  
  const DEEP_WORK_THRESHOLD = 3600; // 60 minutes in seconds
  const deepWorkSessions = sessions.filter(s => s.durationSeconds >= DEEP_WORK_THRESHOLD);
  const ratio = (deepWorkSessions.length / sessions.length) * 100;
  
  return {
    id: 'deepWorkRatio',
    name: 'Deep Work Ratio',
    description: 'Sessions ≥60min / Total sessions',
    value: Math.round(ratio),
    unit: '%',
    format: 'percentage'
  };
};

/**
 * Calculate Consistency Index
 * Percentage of active days (from settings) that have at least one session
 * Tracks habit formation without pressure
 */
export const calculateConsistency = (
  sessions: Session[], 
  activeDays: number[], 
  lookbackDays: number = 7
): CustomMetric => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get dates for the lookback period
  const dates: Date[] = [];
  for (let i = 0; i < lookbackDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  // Filter to only active days
  const activeDates = dates.filter(date => activeDays.includes(date.getDay()));
  
  if (activeDates.length === 0) {
    return {
      id: 'consistency',
      name: `Consistency (${lookbackDays}d)`,
      description: 'Active days with sessions',
      value: undefined,
      unit: '%',
      format: 'percentage'
    };
  }
  
  // Count active days with sessions
  const daysWithSessions = activeDates.filter(date => {
    const dateStr = date.toISOString().split('T')[0];
    return sessions.some(s => s.date === dateStr);
  }).length;
  
  const consistencyRate = (daysWithSessions / activeDates.length) * 100;
  
  return {
    id: 'consistency',
    name: `Consistency (${lookbackDays}d)`,
    description: 'Active days with sessions',
    value: Math.round(consistencyRate),
    unit: '%',
    format: 'percentage'
  };
};

/**
 * Calculate Average Session Duration
 * Simple metric for tracking typical session length
 */
export const calculateAvgSessionDuration = (sessions: Session[]): CustomMetric => {
  if (sessions.length === 0) {
    return {
      id: 'avgDuration',
      name: 'Avg Session',
      description: 'Average session duration',
      value: undefined,
      unit: 'min',
      format: 'time'
    };
  }
  
  const totalDuration = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const avgSeconds = totalDuration / sessions.length;
  const avgMinutes = Math.round(avgSeconds / 60);
  
  return {
    id: 'avgDuration',
    name: 'Avg Session',
    description: 'Average session duration',
    value: avgMinutes,
    unit: 'min',
    format: 'time'
  };
};

/**
 * Calculate Budget Adherence
 * Percentage of sessions where actual time met or exceeded target
 */
export const calculateBudgetAdherence = (sessions: Session[]): CustomMetric => {
  const sessionsWithTarget = sessions.filter(s => s.targetDurationSeconds && s.targetDurationSeconds > 0);
  
  if (sessionsWithTarget.length === 0) {
    return {
      id: 'budgetAdherence',
      name: 'Budget Adherence',
      description: 'Sessions meeting commitment',
      value: undefined,
      unit: '%',
      format: 'percentage'
    };
  }
  
  const metOrExceeded = sessionsWithTarget.filter(s => {
    const balance = getSessionBudgetBalance(s);
    return balance >= 0; // Met or exceeded target
  }).length;
  
  const adherenceRate = (metOrExceeded / sessionsWithTarget.length) * 100;
  
  return {
    id: 'budgetAdherence',
    name: 'Budget Adherence',
    description: 'Sessions meeting commitment',
    value: Math.round(adherenceRate),
    unit: '%',
    format: 'percentage'
  };
};

/**
 * Get all available metrics with their current values
 */
export const calculateAllMetrics = (
  sessions: Session[],
  activeDays: number[] = [1, 2, 3, 4, 5],
  lookbackDays: number = 7
): CustomMetric[] => {
  // Filter sessions to lookback period
  const today = new Date();
  const lookbackStart = new Date(today);
  lookbackStart.setDate(lookbackStart.getDate() - lookbackDays);
  
  const recentSessions = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= lookbackStart;
  });
  
  return [
    calculateFocusQuality(recentSessions),
    calculateDeepWorkRatio(recentSessions),
    calculateConsistency(sessions, activeDays, lookbackDays),
    calculateAvgSessionDuration(recentSessions),
    calculateBudgetAdherence(recentSessions),
  ];
};

/**
 * Get metrics filtered by enabled IDs
 */
export const getEnabledMetrics = (
  sessions: Session[],
  enabledIds: string[],
  activeDays: number[] = [1, 2, 3, 4, 5],
  lookbackDays: number = 7
): CustomMetric[] => {
  const allMetrics = calculateAllMetrics(sessions, activeDays, lookbackDays);
  return allMetrics.filter(m => enabledIds.includes(m.id));
};
