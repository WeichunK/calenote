// Calendar utility functions using date-fns
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  parseISO,
  addMonths,
} from 'date-fns';
import type { Entry } from '@calenote/shared';

// Get all 42 days for month grid (6 weeks)
export function getMonthDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  return eachDayOfInterval({ start, end });
}

// Group entries by date
export function groupEntriesByDate(entries: Entry[]): Record<string, Entry[]> {
  const grouped = entries.reduce((acc, entry) => {
    if (!entry.timestamp) return acc;

    // Direct string extraction instead of parsing
    const date = entry.timestamp.substring(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);

    return acc;
  }, {} as Record<string, Entry[]>);

  // Sort once during grouping, not on every cell render
  for (const date in grouped) {
    grouped[date] = sortEntriesForDay(grouped[date]);
  }

  return grouped;
}

// Sort entries for display (by time, then priority)
export function sortEntriesForDay(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    // Completed entries go to bottom
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }

    // Then by time if both have timestamps
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }

    // Then by priority
    return (b.priority || 0) - (a.priority || 0);
  });
}

// Get entry type icon
export function getEntryTypeIcon(type: Entry['entry_type']): string {
  switch (type) {
    case 'event':
      return '📅';
    case 'task':
      return '✓';
    case 'note':
      return '📝';
    default:
      return '📄';
  }
}

// Format date helpers
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

// Export date-fns functions for convenience
export { isSameMonth, isToday, addMonths, parseISO, startOfMonth, endOfMonth };

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
