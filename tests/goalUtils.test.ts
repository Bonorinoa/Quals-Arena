import { describe, it, expect } from 'vitest';
import { getGoalLabels, formatGoalCount } from '../utils/goalUtils';
import { UserSettings, DEFAULT_SETTINGS } from '../types';

describe('goalUtils', () => {
  describe('getGoalLabels', () => {
    it('should return default "problems" labels when no goalCategoryId is set', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: undefined,
      };
      
      const labels = getGoalLabels(settings);
      
      expect(labels.singular).toBe('problem');
      expect(labels.plural).toBe('problems');
      expect(labels.name).toBe('Problems Solved');
    });

    it('should return "problems" labels when goalCategoryId is "problems"', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'problems',
      };
      
      const labels = getGoalLabels(settings);
      
      expect(labels.singular).toBe('problem');
      expect(labels.plural).toBe('problems');
      expect(labels.name).toBe('Problems Solved');
      expect(labels.category.id).toBe('problems');
    });

    it('should return "tasks" labels when goalCategoryId is "tasks"', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'tasks',
      };
      
      const labels = getGoalLabels(settings);
      
      expect(labels.singular).toBe('task');
      expect(labels.plural).toBe('tasks');
      expect(labels.name).toBe('Tasks Completed');
      expect(labels.category.id).toBe('tasks');
    });

    it('should return "pomodoros" labels when goalCategoryId is "pomodoros"', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'pomodoros',
      };
      
      const labels = getGoalLabels(settings);
      
      expect(labels.singular).toBe('pomodoro');
      expect(labels.plural).toBe('pomodoros');
      expect(labels.name).toBe('Pomodoro Cycles');
      expect(labels.category.id).toBe('pomodoros');
    });

    it('should return "pages" labels when goalCategoryId is "pages"', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'pages',
      };
      
      const labels = getGoalLabels(settings);
      
      expect(labels.singular).toBe('page');
      expect(labels.plural).toBe('pages');
      expect(labels.name).toBe('Pages Read/Written');
      expect(labels.category.id).toBe('pages');
    });

    it('should return custom labels when goalCategoryId is "custom" with customGoalUnit', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'custom',
        customGoalUnit: 'chapter',
        customGoalUnitPlural: 'chapters',
      };
      
      const labels = getGoalLabels(settings);
      
      expect(labels.singular).toBe('chapter');
      expect(labels.plural).toBe('chapters');
      expect(labels.name).toBe('Custom Goal');
    });

    it('should auto-pluralize custom unit when customGoalUnitPlural is not provided', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'custom',
        customGoalUnit: 'module',
      };
      
      const labels = getGoalLabels(settings);
      
      expect(labels.singular).toBe('module');
      expect(labels.plural).toBe('modules');
      expect(labels.name).toBe('Custom Goal');
    });

    it('should fall back to default category when custom unit is not provided', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'custom',
      };
      
      const labels = getGoalLabels(settings);
      
      expect(labels.singular).toBe('unit');
      expect(labels.plural).toBe('units');
      expect(labels.name).toBe('Custom');
    });
  });

  describe('formatGoalCount', () => {
    it('should use singular form for count of 1', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'problems',
      };
      
      const result = formatGoalCount(1, settings);
      
      expect(result).toBe('1 problem');
    });

    it('should use plural form for count of 0', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'problems',
      };
      
      const result = formatGoalCount(0, settings);
      
      expect(result).toBe('0 problems');
    });

    it('should use plural form for count greater than 1', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'tasks',
      };
      
      const result = formatGoalCount(5, settings);
      
      expect(result).toBe('5 tasks');
    });

    it('should work with custom units', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'custom',
        customGoalUnit: 'sprint',
        customGoalUnitPlural: 'sprints',
      };
      
      expect(formatGoalCount(1, settings)).toBe('1 sprint');
      expect(formatGoalCount(3, settings)).toBe('3 sprints');
    });

    it('should handle large numbers', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        goalCategoryId: 'pomodoros',
      };
      
      const result = formatGoalCount(100, settings);
      
      expect(result).toBe('100 pomodoros');
    });
  });
});
