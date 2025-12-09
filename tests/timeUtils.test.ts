import { describe, it, expect } from 'vitest';
import { formatTime, formatTimeFull } from '../utils/timeUtils';

describe('timeUtils', () => {
  describe('formatTime', () => {
    it('should format 0 seconds correctly', () => {
      expect(formatTime(0)).toBe('00:00:00');
    });

    it('should format seconds only', () => {
      expect(formatTime(45)).toBe('00:00:45');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(125)).toBe('00:02:05');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatTime(3665)).toBe('01:01:05');
    });

    it('should handle multiple hours', () => {
      expect(formatTime(7325)).toBe('02:02:05');
    });

    it('should pad single digits with zeros', () => {
      expect(formatTime(3601)).toBe('01:00:01');
    });

    it('should handle exactly 1 hour', () => {
      expect(formatTime(3600)).toBe('01:00:00');
    });

    it('should handle large durations', () => {
      expect(formatTime(36000)).toBe('10:00:00');
    });
  });

  describe('formatTimeFull', () => {
    it('should format positive values like formatTime', () => {
      expect(formatTimeFull(3665)).toBe('01:01:05');
    });

    it('should handle negative values', () => {
      expect(formatTimeFull(-3665)).toBe('01:01:05');
    });

    it('should handle 0', () => {
      expect(formatTimeFull(0)).toBe('00:00:00');
    });

    it('should handle negative seconds only', () => {
      expect(formatTimeFull(-45)).toBe('00:00:45');
    });

    it('should handle negative hours', () => {
      expect(formatTimeFull(-7325)).toBe('02:02:05');
    });

    it('should floor fractional seconds', () => {
      expect(formatTimeFull(65.8)).toBe('00:01:05');
      expect(formatTimeFull(-65.8)).toBe('00:01:05');
    });
  });
});
