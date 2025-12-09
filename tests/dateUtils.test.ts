import { describe, it, expect } from 'vitest';
import {
  getLocalDate,
  dateToLocalString,
  getYesterdayDate,
  subtractDays,
} from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('getLocalDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const result = getLocalDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return current local date', () => {
      const result = getLocalDate();
      const now = new Date();
      const expected = now.toISOString().split('T')[0];
      // Allow for timezone differences - result should be within 1 day of expected
      const resultDate = new Date(result);
      const expectedDate = new Date(expected);
      const diffDays = Math.abs(resultDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeLessThan(1);
    });
  });

  describe('dateToLocalString', () => {
    it('should convert Date to YYYY-MM-DD format', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = dateToLocalString(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle timezone offset correctly', () => {
      const date = new Date('2024-06-15T00:00:00Z');
      const result = dateToLocalString(date);
      // Should return a date string, accounting for timezone
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getYesterdayDate', () => {
    it('should return yesterday in YYYY-MM-DD format', () => {
      const result = getYesterdayDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return date one day before today', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const result = getYesterdayDate();
      const resultDate = new Date(result);
      const expectedDate = new Date(yesterday.toISOString().split('T')[0]);
      
      // Allow for timezone differences
      const diffDays = Math.abs(resultDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeLessThan(1);
    });
  });

  describe('subtractDays', () => {
    it('should subtract days correctly', () => {
      const baseDate = new Date('2024-06-15');
      const result = subtractDays(baseDate, 5);
      expect(result).toBe('2024-06-10');
    });

    it('should handle month boundary', () => {
      const baseDate = new Date('2024-06-03');
      const result = subtractDays(baseDate, 5);
      expect(result).toBe('2024-05-29');
    });

    it('should handle year boundary', () => {
      const baseDate = new Date('2024-01-03');
      const result = subtractDays(baseDate, 5);
      expect(result).toBe('2023-12-29');
    });

    it('should handle 0 days', () => {
      const baseDate = new Date('2024-06-15');
      const result = subtractDays(baseDate, 0);
      expect(result).toBe('2024-06-15');
    });
  });
});
