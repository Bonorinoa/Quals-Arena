/**
 * Utility functions for time formatting
 */

/**
 * Format seconds into HH:MM:SS format
 * @param totalSeconds - Total seconds to format
 * @returns Formatted time string in HH:MM:SS format
 */
export const formatTime = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Format seconds into HH:MM:SS format (handles negative values)
 * @param secs - Seconds to format (can be negative)
 * @returns Formatted time string in HH:MM:SS format
 */
export const formatTimeFull = (secs: number): string => {
  const absSecs = Math.abs(secs);
  const h = Math.floor(absSecs / 3600);
  const m = Math.floor((absSecs % 3600) / 60);
  const s = Math.floor(absSecs % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
