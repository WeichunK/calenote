'use client';

import { useState, useMemo } from 'react';
import type { Entry } from '@calenote/shared';
import { useCalendar } from '@/lib/hooks/useCalendar';
import { useEntries } from '@/lib/hooks/useEntries';
import { formatDate, startOfMonth, endOfMonth, groupEntriesByDate } from '@/lib/utils/calendar';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { EntryDialog } from './EntryDialog';
import { DayEntriesModal } from './DayEntriesModal';

// TODO: Get calendar_id from auth context or selected calendar
const TEMP_CALENDAR_ID = '00000000-0000-0000-0000-000000000001';

// Unified dialog state - eliminates state explosion and race conditions
type DialogState =
  | { type: 'closed' }
  | { type: 'create'; date: Date }
  | { type: 'edit'; entry: Entry }
  | { type: 'day-list'; date: Date; entries: Entry[] };

export function CalendarView() {
  const { viewingMonth, goToToday, goToPrevMonth, goToNextMonth } = useCalendar();
  const [dialog, setDialog] = useState<DialogState>({ type: 'closed' });

  // Fetch entries for current month
  const { data: entries, isLoading, error } = useEntries({
    has_timestamp: true,
    start_date: formatDate(startOfMonth(viewingMonth)),
    end_date: formatDate(endOfMonth(viewingMonth)),
  });

  // Group entries by date for DayEntriesModal
  const entriesByDate = useMemo(
    () => groupEntriesByDate(entries || []),
    [entries]
  );

  const handleDateClick = (date: Date) => {
    setDialog({ type: 'create', date });
  };

  const handleEntryClick = (entry: Entry) => {
    setDialog({ type: 'edit', entry });
  };

  const handleShowMore = (date: Date) => {
    const dateEntries = entriesByDate[formatDate(date)] || [];
    setDialog({ type: 'day-list', date, entries: dateEntries });
  };

  const handleDialogClose = () => {
    setDialog({ type: 'closed' });
  };

  const handleCreateFromDayList = () => {
    if (dialog.type === 'day-list') {
      setDialog({ type: 'create', date: dialog.date });
    }
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
        error={error}
      />

      <EntryDialog
        open={dialog.type === 'create' || dialog.type === 'edit'}
        onOpenChange={(open) => !open && handleDialogClose()}
        entry={dialog.type === 'edit' ? dialog.entry : undefined}
        defaultDate={dialog.type === 'create' ? dialog.date : undefined}
        calendarId={TEMP_CALENDAR_ID}
      />

      <DayEntriesModal
        open={dialog.type === 'day-list'}
        onOpenChange={(open) => !open && handleDialogClose()}
        date={dialog.type === 'day-list' ? dialog.date : new Date()}
        entries={dialog.type === 'day-list' ? dialog.entries : []}
        onEntryClick={handleEntryClick}
        onCreateEntry={handleCreateFromDayList}
      />
    </div>
  );
}
