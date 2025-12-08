/**
 * Utility functions for date manipulation and formatting
 */

/**
 * Get the local date string in YYYY-MM-DD format
 * Handles timezone offset to ensure local date is correct
 * @returns Date string in YYYY-MM-DD format
 */
export const getLocalDate = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - (offset * 60 * 1000));
  return local.toISOString().split('T')[0];
};

/**
 * Convert a Date object to local date string in YYYY-MM-DD format
 * @param date - Date object to convert
 * @returns Date string in YYYY-MM-DD format
 */
export const dateToLocalString = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - (offset * 60 * 1000));
  return local.toISOString().split('T')[0];
};

/**
 * Get yesterday's date string in YYYY-MM-DD format
 * @returns Yesterday's date string in YYYY-MM-DD format
 */
export const getYesterdayDate = (): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return dateToLocalString(yesterday);
};

/**
 * Subtract days from a date and return as local date string
 * @param date - Base date
 * @param days - Number of days to subtract
 * @returns Date string in YYYY-MM-DD format
 */
export const subtractDays = (date: Date, days: number): string => {
  const result = new Date(date);
  result.setDate(date.getDate() - days);
  return dateToLocalString(result);
};
