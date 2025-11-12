/**
 * DateTime Utility Functions for Timezone Handling
 *
 * Core Principle:
 * - Store in UTC (backend always stores UTC)
 * - Display in local timezone
 * - Convert local to UTC before sending to backend
 * - Convert UTC to local when displaying
 */

/**
 * Converts a datetime-local input value (no timezone) to ISO string with UTC timezone
 *
 * @param localDateTimeString - String from datetime-local input (e.g., "2025-11-18T21:00")
 * @returns ISO string in UTC (e.g., "2025-11-18T13:00:00.000Z")
 *
 * @example
 * // User in UTC+8 selects Nov 18, 21:00
 * convertLocalToUTC("2025-11-18T21:00")
 * // Returns: "2025-11-18T13:00:00.000Z" (21:00 - 8 hours = 13:00 UTC)
 */
export function convertLocalToUTC(localDateTimeString: string): string {
  if (!localDateTimeString) return '';

  // Create Date object - browser interprets as local timezone
  const localDate = new Date(localDateTimeString);

  // Convert to ISO string (automatically converts to UTC)
  return localDate.toISOString();
}

/**
 * Converts UTC ISO string to local datetime-local format (for input fields)
 *
 * @param utcISOString - ISO string in UTC (e.g., "2025-11-18T13:00:00Z")
 * @returns Datetime-local format (e.g., "2025-11-18T21:00")
 *
 * @example
 * // Backend returns UTC time
 * convertUTCToLocal("2025-11-18T13:00:00Z")
 * // User in UTC+8 sees: "2025-11-18T21:00" (13:00 + 8 hours = 21:00 local)
 */
export function convertUTCToLocal(utcISOString: string): string {
  if (!utcISOString) return '';

  // Parse UTC string
  const utcDate = new Date(utcISOString);

  // Get local time components
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getDate()).padStart(2, '0');
  const hours = String(utcDate.getHours()).padStart(2, '0');
  const minutes = String(utcDate.getMinutes()).padStart(2, '0');

  // Return in datetime-local format
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Validates if a datetime string is valid
 *
 * @param dateTimeString - Any datetime string
 * @returns true if valid, false otherwise
 */
export function isValidDateTime(dateTimeString: string): boolean {
  if (!dateTimeString) return false;
  const date = new Date(dateTimeString);
  return !isNaN(date.getTime());
}

/**
 * Gets current datetime in local datetime-local format
 *
 * @returns Current datetime in "YYYY-MM-DDTHH:mm" format
 */
export function getCurrentLocalDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
