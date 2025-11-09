'use client';

import type { Entry } from '@calenote/shared';
import { useCalendar } from '@/lib/hooks/useCalendar';
import { useEntries } from '@/lib/hooks/useEntries';
import { formatDate, startOfMonth, endOfMonth } from '@/lib/utils/calendar';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';

export function CalendarView() {
  const { viewingMonth, goToToday, goToPrevMonth, goToNextMonth } = useCalendar();

  // Fetch entries for current month
  const { data: entries, isLoading, error } = useEntries({
    has_timestamp: true,
    start_date: formatDate(startOfMonth(viewingMonth)),
    end_date: formatDate(endOfMonth(viewingMonth)),
  });

  const handleDateClick = (date: Date) => {
    // TODO: Open EntryDialog for creating new entry
    console.log('Create entry for date:', date);
  };

  const handleEntryClick = (entry: Entry) => {
    // TODO: Open EntryDialog for editing entry
    console.log('Edit entry:', entry);
  };

  const handleShowMore = (date: Date) => {
    // TODO: Open DayEntriesModal
    console.log('Show all entries for date:', date);
  };

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        currentMonth={viewingMonth}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
      />
      <CalendarGrid
        month={viewingMonth}
        entries={entries || []}
        onDateClick={handleDateClick}
        onEntryClick={handleEntryClick}
        onShowMore={handleShowMore}
        isLoading={isLoading}
      />

      {/* TODO: Add EntryDialog */}
      {/* TODO: Add DayEntriesModal */}
    </div>
  );
}
