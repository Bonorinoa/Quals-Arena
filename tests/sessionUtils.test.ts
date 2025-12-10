import { describe, it, expect } from 'vitest';
import {
  getTotalDuration,
  getTotalReps,
  getSessionsByDate,
  calculateSER,
  getSessionBudgetBalance,
  getDailyBudgetBalance,
  getWeeklyBudgetBalance,
  analyzeCommitmentPatterns,
  getDailyTotalHours,
  isDailyLimitExceeded,
  DAILY_LIMIT_HOURS,
  MIN_DURATION_THRESHOLD_SECONDS,
  MAX_SURPLUS_RATIO,
  MIN_COMMITMENT_SECONDS,
} from '../utils/sessionUtils';
import { Session } from '../types';

describe('sessionUtils', () => {
  describe('getTotalDuration', () => {
    it('should return 0 for empty array', () => {
      expect(getTotalDuration([])).toBe(0);
    });

    it('should calculate total duration correctly', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 3600, reps: 5, notes: '', date: '2024-01-01' },
        { id: '2', timestamp: 0, durationSeconds: 1800, reps: 3, notes: '', date: '2024-01-01' },
      ];
      expect(getTotalDuration(sessions)).toBe(5400);
    });
  });

  describe('getTotalReps', () => {
    it('should return 0 for empty array', () => {
      expect(getTotalReps([])).toBe(0);
    });

    it('should calculate total reps correctly', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 3600, reps: 5, notes: '', date: '2024-01-01' },
        { id: '2', timestamp: 0, durationSeconds: 1800, reps: 3, notes: '', date: '2024-01-01' },
      ];
      expect(getTotalReps(sessions)).toBe(8);
    });
  });

  describe('getSessionsByDate', () => {
    it('should filter sessions by date', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 3600, reps: 5, notes: '', date: '2024-01-01' },
        { id: '2', timestamp: 0, durationSeconds: 1800, reps: 3, notes: '', date: '2024-01-02' },
        { id: '3', timestamp: 0, durationSeconds: 2400, reps: 4, notes: '', date: '2024-01-01' },
      ];
      const filtered = getSessionsByDate(sessions, '2024-01-01');
      expect(filtered).toHaveLength(2);
      expect(filtered.map(s => s.id)).toEqual(['1', '3']);
    });

    it('should return empty array when no sessions match', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 3600, reps: 5, notes: '', date: '2024-01-01' },
      ];
      expect(getSessionsByDate(sessions, '2024-01-02')).toEqual([]);
    });
  });

  describe('calculateSER', () => {
    it('should return 0 when duration is below threshold', () => {
      expect(calculateSER(10, 200)).toBe(0);
    });

    it('should calculate SER correctly', () => {
      // 10 reps in 1 hour = 10 reps/hour
      expect(calculateSER(10, 3600)).toBe(10);
    });

    it('should calculate SER with fractional results', () => {
      // 15 reps in 2 hours = 7.5 reps/hour
      expect(calculateSER(15, 7200)).toBe(7.5);
    });

    it('should handle custom threshold', () => {
      expect(calculateSER(5, 100, 50)).toBe(180); // 5 reps in 100 seconds = 180 reps/hour
    });
  });

  describe('getSessionBudgetBalance', () => {
    it('should return 0 when no target is set', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 3600,
        reps: 5,
        notes: '',
        date: '2024-01-01',
      };
      expect(getSessionBudgetBalance(session)).toBe(0);
    });

    it('should calculate surplus correctly', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 4000,
        targetDurationSeconds: 3600,
        reps: 5,
        notes: '',
        date: '2024-01-01',
      };
      expect(getSessionBudgetBalance(session)).toBe(400);
    });

    it('should calculate deficit correctly', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 3000,
        targetDurationSeconds: 3600,
        reps: 5,
        notes: '',
        date: '2024-01-01',
      };
      expect(getSessionBudgetBalance(session)).toBe(-600);
    });

    it('should handle exact match', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 3600,
        targetDurationSeconds: 3600,
        reps: 5,
        notes: '',
        date: '2024-01-01',
      };
      expect(getSessionBudgetBalance(session)).toBe(0);
    });
  });

  describe('getDailyBudgetBalance', () => {
    it('should return 0 for empty array', () => {
      expect(getDailyBudgetBalance([])).toBe(0);
    });

    it('should calculate daily balance with mixed surplus and deficit', () => {
      const sessions: Session[] = [
        {
          id: '1',
          timestamp: 0,
          durationSeconds: 4000,
          targetDurationSeconds: 3600,
          reps: 5,
          notes: '',
          date: '2024-01-01',
        },
        {
          id: '2',
          timestamp: 0,
          durationSeconds: 3000,
          targetDurationSeconds: 3600,
          reps: 3,
          notes: '',
          date: '2024-01-01',
        },
      ];
      // +400 - 600 = -200
      expect(getDailyBudgetBalance(sessions)).toBe(-200);
    });
  });

  describe('getWeeklyBudgetBalance', () => {
    it('should calculate weekly balance correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      const sessions: Session[] = [
        {
          id: '1',
          timestamp: 0,
          durationSeconds: 4000,
          targetDurationSeconds: 3600,
          reps: 5,
          notes: '',
          date: '2024-01-01',
        },
        {
          id: '2',
          timestamp: 0,
          durationSeconds: 3000,
          targetDurationSeconds: 3600,
          reps: 3,
          notes: '',
          date: '2024-01-02',
        },
        {
          id: '3',
          timestamp: 0,
          durationSeconds: 3600,
          targetDurationSeconds: 3600,
          reps: 4,
          notes: '',
          date: '2024-01-03',
        },
      ];

      const result = getWeeklyBudgetBalance(sessions, startDate, endDate);
      
      expect(result.totalBalance).toBe(-200); // 400 - 600 + 0
      expect(result.averageDailyBalance).toBeCloseTo(-28.57, 1); // -200 / 7
      expect(result.totalSurplus).toBe(400);
      expect(result.totalDeficit).toBe(-600);
      expect(result.daysWithSessions).toBe(3);
    });

    it('should handle empty sessions', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      const result = getWeeklyBudgetBalance([], startDate, endDate);
      
      expect(result.totalBalance).toBe(0);
      expect(result.averageDailyBalance).toBe(0);
      expect(result.totalSurplus).toBe(0);
      expect(result.totalDeficit).toBe(0);
      expect(result.daysWithSessions).toBe(0);
    });

    it('should only include sessions within date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      const sessions: Session[] = [
        {
          id: '1',
          timestamp: 0,
          durationSeconds: 4000,
          targetDurationSeconds: 3600,
          reps: 5,
          notes: '',
          date: '2024-01-01',
        },
        {
          id: '2',
          timestamp: 0,
          durationSeconds: 3000,
          targetDurationSeconds: 3600,
          reps: 3,
          notes: '',
          date: '2024-01-10', // Outside range
        },
      ];

      const result = getWeeklyBudgetBalance(sessions, startDate, endDate);
      
      expect(result.totalBalance).toBe(400);
      expect(result.daysWithSessions).toBe(1);
    });
  });

  describe('Surplus Cap (Proportional)', () => {
    it('should cap surplus at 50% of commitment (2h commit, 4h actual)', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 14400, // 4 hours
        targetDurationSeconds: 7200, // 2 hours
        reps: 10,
        notes: '',
        date: '2024-01-01',
      };
      // Raw surplus would be 7200s (2h), but capped at 3600s (1h = 50% of 2h)
      expect(getSessionBudgetBalance(session)).toBe(3600);
    });

    it('should cap surplus at 50% of commitment (30m commit, 2h actual)', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 7200, // 2 hours
        targetDurationSeconds: 1800, // 30 minutes
        reps: 8,
        notes: '',
        date: '2024-01-01',
      };
      // Raw surplus would be 5400s (90m), but capped at 900s (15m = 50% of 30m)
      expect(getSessionBudgetBalance(session)).toBe(900);
    });

    it('should not cap surplus when within 50% threshold', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 5400, // 90 minutes
        targetDurationSeconds: 3600, // 1 hour
        reps: 7,
        notes: '',
        date: '2024-01-01',
      };
      // Surplus is 1800s (30m), which is exactly 50%, so not capped
      expect(getSessionBudgetBalance(session)).toBe(1800);
    });

    it('should not cap deficits (allow full deficit)', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 1800, // 30 minutes
        targetDurationSeconds: 7200, // 2 hours
        reps: 3,
        notes: '',
        date: '2024-01-01',
      };
      // Deficit of 5400s (90m) should not be capped
      expect(getSessionBudgetBalance(session)).toBe(-5400);
    });

    it('should handle exact commitment match (no surplus/deficit)', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 3600,
        targetDurationSeconds: 3600,
        reps: 5,
        notes: '',
        date: '2024-01-01',
      };
      expect(getSessionBudgetBalance(session)).toBe(0);
    });

    it('should handle 4h commitment with massive overperformance', () => {
      const session: Session = {
        id: '1',
        timestamp: 0,
        durationSeconds: 28800, // 8 hours
        targetDurationSeconds: 14400, // 4 hours
        reps: 20,
        notes: '',
        date: '2024-01-01',
      };
      // Raw surplus would be 14400s (4h), but capped at 7200s (2h = 50% of 4h)
      expect(getSessionBudgetBalance(session)).toBe(7200);
    });

    it('should verify MAX_SURPLUS_RATIO constant is 0.5', () => {
      expect(MAX_SURPLUS_RATIO).toBe(0.5);
    });
  });

  describe('analyzeCommitmentPatterns', () => {
    it('should return zeroes for empty sessions array', () => {
      const result = analyzeCommitmentPatterns([]);
      expect(result.averageCommitment).toBe(0);
      expect(result.minimumCommitmentRatio).toBe(0);
      expect(result.hasLowCommitmentPattern).toBe(false);
    });

    it('should return zeroes when no sessions have commitments', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 3600, reps: 5, notes: '', date: '2024-01-01' },
        { id: '2', timestamp: 0, durationSeconds: 2400, reps: 3, notes: '', date: '2024-01-02' },
      ];
      const result = analyzeCommitmentPatterns(sessions);
      expect(result.averageCommitment).toBe(0);
      expect(result.minimumCommitmentRatio).toBe(0);
      expect(result.hasLowCommitmentPattern).toBe(false);
    });

    it('should calculate average commitment correctly', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 3600, targetDurationSeconds: 3600, reps: 5, notes: '', date: '2024-01-01' },
        { id: '2', timestamp: 0, durationSeconds: 5400, targetDurationSeconds: 7200, reps: 8, notes: '', date: '2024-01-02' },
        { id: '3', timestamp: 0, durationSeconds: 4500, targetDurationSeconds: 5400, reps: 6, notes: '', date: '2024-01-03' },
      ];
      const result = analyzeCommitmentPatterns(sessions);
      // Average: (3600 + 7200 + 5400) / 3 = 5400
      expect(result.averageCommitment).toBe(5400);
    });

    it('should detect low commitment pattern (80% minimum)', () => {
      const sessions: Session[] = Array(10).fill(null).map((_, i) => ({
        id: `${i}`,
        timestamp: 0,
        durationSeconds: 3600,
        targetDurationSeconds: MIN_COMMITMENT_SECONDS, // 30 minutes (minimum)
        reps: 5,
        notes: '',
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      }));
      
      // Add 2 sessions with higher commitment
      sessions.push({
        id: '10',
        timestamp: 0,
        durationSeconds: 7200,
        targetDurationSeconds: 7200, // 2 hours
        reps: 10,
        notes: '',
        date: '2024-01-11',
      });
      sessions.push({
        id: '11',
        timestamp: 0,
        durationSeconds: 3600,
        targetDurationSeconds: 3600, // 1 hour
        reps: 7,
        notes: '',
        date: '2024-01-12',
      });

      const result = analyzeCommitmentPatterns(sessions);
      // 10 out of 12 sessions are minimum (83.3%)
      expect(result.minimumCommitmentRatio).toBeCloseTo(0.833, 2);
      expect(result.hasLowCommitmentPattern).toBe(true);
    });

    it('should not flag pattern with less than 10 sessions', () => {
      const sessions: Session[] = Array(5).fill(null).map((_, i) => ({
        id: `${i}`,
        timestamp: 0,
        durationSeconds: 3600,
        targetDurationSeconds: MIN_COMMITMENT_SECONDS, // All minimum
        reps: 5,
        notes: '',
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      }));

      const result = analyzeCommitmentPatterns(sessions);
      expect(result.minimumCommitmentRatio).toBe(1.0); // 100% minimum
      expect(result.hasLowCommitmentPattern).toBe(false); // But not flagged (< 10 sessions)
    });

    it('should not flag pattern when minimum ratio is below threshold', () => {
      const sessions: Session[] = Array(10).fill(null).map((_, i) => ({
        id: `${i}`,
        timestamp: 0,
        durationSeconds: 7200,
        targetDurationSeconds: 7200, // All 2 hours
        reps: 10,
        notes: '',
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      }));

      const result = analyzeCommitmentPatterns(sessions);
      expect(result.minimumCommitmentRatio).toBe(0); // 0% minimum
      expect(result.hasLowCommitmentPattern).toBe(false);
    });

    it('should handle mixed commitment levels correctly', () => {
      const sessions: Session[] = [
        // 3 x 30m
        { id: '1', timestamp: 0, durationSeconds: 3600, targetDurationSeconds: MIN_COMMITMENT_SECONDS, reps: 5, notes: '', date: '2024-01-01' },
        { id: '2', timestamp: 0, durationSeconds: 3600, targetDurationSeconds: MIN_COMMITMENT_SECONDS, reps: 5, notes: '', date: '2024-01-02' },
        { id: '3', timestamp: 0, durationSeconds: 3600, targetDurationSeconds: MIN_COMMITMENT_SECONDS, reps: 5, notes: '', date: '2024-01-03' },
        // 7 x 2h
        ...Array(7).fill(null).map((_, i) => ({
          id: `${i + 4}`,
          timestamp: 0,
          durationSeconds: 7200,
          targetDurationSeconds: 7200,
          reps: 10,
          notes: '',
          date: `2024-01-${String(i + 4).padStart(2, '0')}`,
        })),
      ];

      const result = analyzeCommitmentPatterns(sessions);
      expect(result.minimumCommitmentRatio).toBe(0.3); // 3/10 = 30%
      expect(result.hasLowCommitmentPattern).toBe(false); // Below 70% threshold
    });
  });

  describe('getDailyTotalHours', () => {
    it('should return 0 for date with no sessions', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 3600, reps: 5, notes: '', date: '2024-01-01' },
      ];
      expect(getDailyTotalHours(sessions, '2024-01-02')).toBe(0);
    });

    it('should calculate total hours for a single session', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 7200, reps: 5, notes: '', date: '2024-01-01' }, // 2 hours
      ];
      expect(getDailyTotalHours(sessions, '2024-01-01')).toBe(2);
    });

    it('should calculate total hours for multiple sessions on same day', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 7200, reps: 5, notes: '', date: '2024-01-01' }, // 2 hours
        { id: '2', timestamp: 0, durationSeconds: 5400, reps: 3, notes: '', date: '2024-01-01' }, // 1.5 hours
        { id: '3', timestamp: 0, durationSeconds: 3600, reps: 2, notes: '', date: '2024-01-01' }, // 1 hour
      ];
      expect(getDailyTotalHours(sessions, '2024-01-01')).toBe(4.5);
    });

    it('should only count sessions from the specified date', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 7200, reps: 5, notes: '', date: '2024-01-01' },
        { id: '2', timestamp: 0, durationSeconds: 3600, reps: 3, notes: '', date: '2024-01-02' },
        { id: '3', timestamp: 0, durationSeconds: 5400, reps: 2, notes: '', date: '2024-01-01' },
      ];
      expect(getDailyTotalHours(sessions, '2024-01-01')).toBe(3.5); // 7200 + 5400 = 12600 seconds = 3.5 hours
    });
  });

  describe('isDailyLimitExceeded', () => {
    it('should return false when no sessions exist', () => {
      expect(isDailyLimitExceeded([], '2024-01-01')).toBe(false);
    });

    it('should return false when total is exactly at the limit', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: DAILY_LIMIT_HOURS * 3600, reps: 5, notes: '', date: '2024-01-01' },
      ];
      expect(isDailyLimitExceeded(sessions, '2024-01-01')).toBe(false);
    });

    it('should return true when total exceeds the 6-hour limit', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 7200, reps: 5, notes: '', date: '2024-01-01' }, // 2 hours
        { id: '2', timestamp: 0, durationSeconds: 7200, reps: 3, notes: '', date: '2024-01-01' }, // 2 hours
        { id: '3', timestamp: 0, durationSeconds: 7200, reps: 2, notes: '', date: '2024-01-01' }, // 2 hours
        { id: '4', timestamp: 0, durationSeconds: 1800, reps: 1, notes: '', date: '2024-01-01' }, // 0.5 hours
      ];
      // Total: 6.5 hours
      expect(isDailyLimitExceeded(sessions, '2024-01-01')).toBe(true);
    });

    it('should return false when total is below the limit', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 7200, reps: 5, notes: '', date: '2024-01-01' }, // 2 hours
        { id: '2', timestamp: 0, durationSeconds: 5400, reps: 3, notes: '', date: '2024-01-01' }, // 1.5 hours
      ];
      // Total: 3.5 hours
      expect(isDailyLimitExceeded(sessions, '2024-01-01')).toBe(false);
    });

    it('should only check sessions from the specified date', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 10800, reps: 5, notes: '', date: '2024-01-01' }, // 3 hours on day 1
        { id: '2', timestamp: 0, durationSeconds: 10800, reps: 3, notes: '', date: '2024-01-02' }, // 3 hours on day 2
        { id: '3', timestamp: 0, durationSeconds: 10800, reps: 2, notes: '', date: '2024-01-01' }, // 3 hours on day 1
      ];
      // Day 1: 6 hours (at limit, not exceeded)
      expect(isDailyLimitExceeded(sessions, '2024-01-01')).toBe(false);
      // Day 2: 3 hours (below limit)
      expect(isDailyLimitExceeded(sessions, '2024-01-02')).toBe(false);
    });

    it('should handle edge case: slightly over 6 hours', () => {
      const sessions: Session[] = [
        { id: '1', timestamp: 0, durationSeconds: 21601, reps: 5, notes: '', date: '2024-01-01' }, // 6 hours + 1 second
      ];
      expect(isDailyLimitExceeded(sessions, '2024-01-01')).toBe(true);
    });
  });
});
