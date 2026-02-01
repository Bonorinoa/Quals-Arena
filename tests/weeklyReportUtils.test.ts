import { describe, it, expect } from 'vitest';
import { generateWeeklyReport, exportReportAsMarkdown } from '../utils/weeklyReportUtils';
import { Session, UserSettings, DEFAULT_SETTINGS } from '../types';
import { format, startOfWeek, endOfWeek } from 'date-fns';

describe('weeklyReportUtils', () => {
  const mockSettings: UserSettings = {
    ...DEFAULT_SETTINGS,
    weeklyRepTarget: 50,
    dailyTimeGoalHours: 4,
    activeDays: [1, 2, 3, 4, 5],
    goalCategoryId: 'problems'
  };

  describe('generateWeeklyReport', () => {
    it('should generate a report for an empty week', () => {
      const sessions: Session[] = [];
      const report = generateWeeklyReport(sessions, mockSettings, 0);

      expect(report.totalSessions).toBe(0);
      expect(report.totalDuration).toBe(0);
      expect(report.totalGoalsCompleted).toBe(0);
      expect(report.activeDaysCount).toBe(0);
      expect(report.sections).toBeInstanceOf(Array);
    });

    it('should calculate basic stats correctly for current week', () => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const todayStr = format(today, 'yyyy-MM-dd');

      const sessions: Session[] = [
        {
          id: '1',
          timestamp: Date.now(),
          durationSeconds: 3600,
          targetDurationSeconds: 3600,
          reps: 5,
          notes: '',
          date: todayStr
        },
        {
          id: '2',
          timestamp: Date.now(),
          durationSeconds: 1800,
          targetDurationSeconds: 1800,
          reps: 3,
          notes: '',
          date: todayStr
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);

      expect(report.totalSessions).toBe(2);
      expect(report.totalDuration).toBe(5400); // 3600 + 1800
      expect(report.totalGoalsCompleted).toBe(8); // 5 + 3
      expect(report.activeDaysCount).toBe(1);
      expect(report.weekStart).toBe(format(weekStart, 'yyyy-MM-dd'));
    });

    it('should calculate budget balance correctly', () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const sessions: Session[] = [
        {
          id: '1',
          timestamp: Date.now(),
          durationSeconds: 7200, // 2 hours
          targetDurationSeconds: 3600, // 1 hour target
          reps: 5,
          notes: '',
          date: todayStr
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);

      // Should have surplus
      expect(report.budgetBalance.total).toBeGreaterThan(0);
      expect(report.budgetBalance.totalSurplus).toBeGreaterThan(0);
    });

    it('should detect best day', () => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const monday = format(weekStart, 'yyyy-MM-dd');
      const tuesday = format(new Date(weekStart.getTime() + 86400000), 'yyyy-MM-dd');

      const sessions: Session[] = [
        {
          id: '1',
          timestamp: Date.now(),
          durationSeconds: 1800,
          reps: 2,
          notes: '',
          date: monday
        },
        {
          id: '2',
          timestamp: Date.now(),
          durationSeconds: 7200, // More duration on Tuesday
          reps: 5,
          notes: '',
          date: tuesday
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);

      expect(report.insights.bestDay).toBe('Tuesday');
    });

    it('should calculate longest session', () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const sessions: Session[] = [
        {
          id: '1',
          timestamp: Date.now(),
          durationSeconds: 1800,
          reps: 2,
          notes: '',
          date: todayStr
        },
        {
          id: '2',
          timestamp: Date.now(),
          durationSeconds: 7200, // Longest
          reps: 5,
          notes: '',
          date: todayStr
        },
        {
          id: '3',
          timestamp: Date.now(),
          durationSeconds: 3600,
          reps: 3,
          notes: '',
          date: todayStr
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);

      expect(report.insights.longestSession).toBe(7200);
    });

    it('should calculate pause patterns when available', () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const sessions: Session[] = [
        {
          id: '1',
          timestamp: Date.now(),
          durationSeconds: 3600,
          reps: 5,
          notes: '',
          date: todayStr,
          pauseCount: 2,
          totalPauseTime: 300 // 5 minutes
        },
        {
          id: '2',
          timestamp: Date.now(),
          durationSeconds: 3600,
          reps: 5,
          notes: '',
          date: todayStr,
          pauseCount: 1,
          totalPauseTime: 180 // 3 minutes
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);

      expect(report.insights.pausePatterns).toBeDefined();
      expect(report.insights.pausePatterns?.avgPausesPerSession).toBe(1.5);
      expect(report.insights.pausePatterns?.avgPauseTime).toBe(240); // (300 + 180) / 2
    });

    it('should generate report sections', () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const sessions: Session[] = [
        {
          id: '1',
          timestamp: Date.now(),
          durationSeconds: 3600,
          targetDurationSeconds: 3600,
          reps: 10,
          notes: '',
          date: todayStr
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);

      expect(report.sections.length).toBeGreaterThan(0);
      const executiveSummary = report.sections.find(s => s.title === 'Executive Summary');
      expect(executiveSummary).toBeDefined();
      expect(executiveSummary?.emoji).toBe('📊');
    });

    it('should calculate week-over-week comparison', () => {
      const today = new Date();
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000);

      const thisWeekDate = format(thisWeekStart, 'yyyy-MM-dd');
      const lastWeekDate = format(lastWeekStart, 'yyyy-MM-dd');

      const sessions: Session[] = [
        // Last week
        {
          id: '1',
          timestamp: Date.now() - 7 * 86400000,
          durationSeconds: 3600,
          reps: 5,
          notes: '',
          date: lastWeekDate
        },
        // This week
        {
          id: '2',
          timestamp: Date.now(),
          durationSeconds: 7200, // Double duration
          reps: 10, // Double reps
          notes: '',
          date: thisWeekDate
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);

      expect(report.weekOverWeek).toBeDefined();
      expect(report.weekOverWeek?.durationChange).toBeCloseTo(100, 0); // 100% increase
      expect(report.weekOverWeek?.goalsChange).toBeCloseTo(100, 0); // 100% increase
    });
  });

  describe('exportReportAsMarkdown', () => {
    it('should export report as markdown format', () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const sessions: Session[] = [
        {
          id: '1',
          timestamp: Date.now(),
          durationSeconds: 3600,
          targetDurationSeconds: 3600,
          reps: 10,
          notes: '',
          date: todayStr
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);
      const markdown = exportReportAsMarkdown(report, mockSettings);

      expect(markdown).toContain('# Weekly Review Report');
      expect(markdown).toContain('**Week:**');
      expect(markdown).toContain('## 📊 Statistics');
      expect(markdown).toContain('| Metric | Value |');
      expect(markdown).toContain('Total Sessions');
      expect(markdown).toContain('Total Duration');
    });

    it('should include week-over-week in markdown when available', () => {
      const today = new Date();
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000);

      const thisWeekDate = format(thisWeekStart, 'yyyy-MM-dd');
      const lastWeekDate = format(lastWeekStart, 'yyyy-MM-dd');

      const sessions: Session[] = [
        {
          id: '1',
          timestamp: Date.now() - 7 * 86400000,
          durationSeconds: 3600,
          reps: 5,
          notes: '',
          date: lastWeekDate
        },
        {
          id: '2',
          timestamp: Date.now(),
          durationSeconds: 7200,
          reps: 10,
          notes: '',
          date: thisWeekDate
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);
      const markdown = exportReportAsMarkdown(report, mockSettings);

      expect(markdown).toContain('## 📈 Week-over-Week');
      expect(markdown).toContain('Duration:');
    });

    it('should include all report sections in markdown', () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const sessions: Session[] = [
        {
          id: '1',
          timestamp: Date.now(),
          durationSeconds: 3600,
          targetDurationSeconds: 3600,
          reps: 10,
          notes: '',
          date: todayStr
        }
      ];

      const report = generateWeeklyReport(sessions, mockSettings, 0);
      const markdown = exportReportAsMarkdown(report, mockSettings);

      report.sections.forEach(section => {
        expect(markdown).toContain(section.title);
      });
    });
  });
});
