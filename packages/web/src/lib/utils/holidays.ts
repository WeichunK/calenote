/**
 * Taiwan Public Holidays Utility Functions
 *
 * Optimized for server-side fetching with Next.js caching
 */

import type { HolidayData, HolidayMap } from '@/types/holiday';

const CDN_BASE_URL = 'https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data';

/**
 * Fetch holidays for a specific year from CDN
 *
 * Features:
 * - 3-second timeout for reliability
 * - Next.js caching (24 hours)
 * - Graceful degradation on failure
 *
 * @param year - The year to fetch holidays for
 * @returns Array of holiday data, or empty array on failure
 */
export async function fetchHolidays(year: number): Promise<HolidayData[]> {
  try {
    const response = await fetch(`${CDN_BASE_URL}/${year}.json`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
      signal: AbortSignal.timeout(3000), // 3-second timeout
    });

    if (!response.ok) {
      throw new Error(`CDN returned status ${response.status}`);
    }

    const data = await response.json();
    return data as HolidayData[];
  } catch (error) {
    console.error(`Failed to fetch holidays for ${year}:`, error);
    // Graceful degradation: return empty array
    return [];
  }
}

/**
 * Build an efficient holiday lookup map
 *
 * Filters to only include:
 * - Public holidays (isHoliday: true)
 * - Makeup workdays (補班日/補假)
 *
 * This reduces ~365 entries to ~15-22 relevant entries
 *
 * @param holidays - Array of holiday data
 * @returns Object map for O(1) lookups
 */
export function buildHolidayMap(holidays: HolidayData[]): HolidayMap {
  const map: HolidayMap = {};

  holidays
    .filter((h) => h.isHoliday || h.description.includes('補班') || h.description.includes('補假'))
    .forEach((h) => {
      map[h.date] = h;
    });

  return map;
}

/**
 * Format a Date object to holiday lookup key
 *
 * @param date - JavaScript Date object
 * @returns Date string in YYYYMMDD format (e.g., "20250101")
 */
export function formatDateToHolidayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Check if a holiday is a makeup workday (補班日)
 *
 * @param holiday - Holiday data object
 * @returns true if it's a makeup workday
 */
export function isMakeupWorkday(holiday: HolidayData | undefined): boolean {
  if (!holiday) return false;
  return !holiday.isHoliday && holiday.description.includes('補班');
}
