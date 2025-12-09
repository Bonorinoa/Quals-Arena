import { describe, it, expect } from 'vitest';
import {
  getTotalDuration,
  getTotalReps,
  getSessionsByDate,
  calculateSER,
  getSessionBudgetBalance,
  getDailyBudgetBalance,
  getWeeklyBudgetBalance,
  MIN_DURATION_THRESHOLD_SECONDS,
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
});
