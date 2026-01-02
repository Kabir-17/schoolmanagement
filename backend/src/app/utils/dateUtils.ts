import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import config from '../config';

/**
 * Timezone-aware date utilities for multi-school support.
 * Each school can operate in its own timezone while maintaining data consistency.
 */

/**
 * Converts a date to school's local timezone and returns normalized date key.
 *
 * @param date - Input date (can be UTC or any timezone)
 * @param timezone - IANA timezone (e.g., 'Africa/Conakry', 'America/New_York'), defaults to config
 * @returns Object with normalized date and dateKey in school timezone
 *
 * @example
 * const { date, dateKey } = getSchoolDate(new Date(), 'Africa/Conakry');
 * // dateKey: '2025-10-16' (in school's local timezone)
 */
export function getSchoolDate(
  date: Date,
  timezone: string = config.school_timezone || 'UTC',
): { date: Date; dateKey: string } {
  try {
    // Convert to school's timezone
    const zonedDate = toZonedTime(date, timezone);

    // Reset to start of day in that timezone
    zonedDate.setHours(0, 0, 0, 0);

    // Generate date key in local timezone (YYYY-MM-DD format)
    const dateKey = format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone });

    return { date: zonedDate, dateKey };
  } catch (error) {
    console.error(`[dateUtils] Error converting date to timezone ${timezone}:`, error);
    // Fallback to UTC if timezone is invalid
    const utcDate = new Date(date);
    utcDate.setUTCHours(0, 0, 0, 0);
    const dateKey = utcDate.toISOString().split('T')[0];
    return { date: utcDate, dateKey };
  }
}

/**
 * Parses a date string in school's timezone to UTC Date object.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timezone - IANA timezone, defaults to config
 * @returns Date object in UTC
 *
 * @example
 * const date = parseSchoolDate('2025-10-16', 'Africa/Conakry');
 * // Returns Date object representing 2025-10-16 00:00:00 in Conakry time, converted to UTC
 */
export function parseSchoolDate(
  dateString: string,
  timezone: string = config.school_timezone || 'UTC',
): Date {
  try {
    // Parse as if in school timezone, then convert to UTC
    const localDate = new Date(dateString + 'T00:00:00');
    return fromZonedTime(localDate, timezone);
  } catch (error) {
    console.error(`[dateUtils] Error parsing date string ${dateString}:`, error);
    // Fallback to basic Date parsing
    return new Date(dateString);
  }
}

/**
 * Gets current date/time in school's timezone.
 *
 * @param timezone - Optional IANA timezone, defaults to config
 * @returns Object with current date and dateKey in school timezone
 *
 * @example
 * const { date, dateKey } = getCurrentSchoolDate();
 * // Returns today's date in school's timezone
 */
export function getCurrentSchoolDate(timezone?: string): { date: Date; dateKey: string } {
  return getSchoolDate(new Date(), timezone);
}

/**
 * Formats a date in school's timezone with custom format string.
 *
 * @param date - Date to format
 * @param formatStr - Format string (date-fns format tokens)
 * @param timezone - Optional IANA timezone, defaults to config
 * @returns Formatted date string
 *
 * @example
 * formatSchoolDate(new Date(), 'MMM dd, yyyy HH:mm', 'Africa/Conakry');
 * // Returns: "Oct 16, 2025 14:30"
 */
export function formatSchoolDate(
  date: Date,
  formatStr: string = 'yyyy-MM-dd',
  timezone: string = config.school_timezone || 'UTC',
): string {
  try {
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, formatStr, { timeZone: timezone });
  } catch (error) {
    console.error(`[dateUtils] Error formatting date:`, error);
    // Fallback to ISO string
    return date.toISOString().split('T')[0];
  }
}

/**
 * Checks if a timezone string is valid IANA timezone.
 *
 * @param timezone - Timezone string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidTimezone('Africa/Conakry'); // true
 * isValidTimezone('Invalid/Zone'); // false
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Legacy function for backward compatibility.
 * Normalizes a date to start of day in school's timezone.
 *
 * @deprecated Use getSchoolDate() instead for timezone-aware behavior
 */
export function normaliseDateKey(date: Date): { date: Date; dateKey: string } {
  // For backward compatibility, use UTC if no timezone configured
  return getSchoolDate(date, 'UTC');
}
