/**
 * Taiwan Public Holiday Type Definitions
 *
 * Data source: Taiwan Government Administrative Agency Office Calendar
 * Community-maintained repository: https://github.com/ruyut/TaiwanCalendar
 */

export interface HolidayData {
  /** Date in YYYYMMDD format (e.g., "20250101") */
  date: string;

  /** Chinese weekday character (日/一/二/三/四/五/六) */
  week: string;

  /** true for public holidays, false for makeup workdays */
  isHoliday: boolean;

  /** Holiday name or reason (e.g., "開國紀念日", "補1/27(一)班") */
  description: string;
}

/**
 * Holiday lookup map for O(1) access
 * Key: date in YYYYMMDD format
 * Value: HolidayData object
 */
export type HolidayMap = Record<string, HolidayData>;
