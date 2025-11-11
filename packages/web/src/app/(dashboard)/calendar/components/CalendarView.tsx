'use client';

import { useState, useMemo, useCallback } from 'react';
import { startOfWeek, endOfWeek, addWeeks, addDays } from 'date-fns';
import type { Entry } from '@calenote/shared';
import { useCalendar } from '@/lib/hooks/useCalendar';
import { useCalendars } from '@/lib/hooks/useCalendars';
import { useEntries } from '@/lib/hooks/useEntries';
import { useTasks } from '@/lib/hooks/useTasks';
import { useCalendarStore } from '@/lib/stores/calendarStore';
import { formatDate, startOfMonth, endOfMonth, groupEntriesByDate } from '@/lib/utils/calendar';
import { CalendarHeader, type CalendarViewType } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { EntryDialog } from './EntryDialog';
import { DayEntriesModal } from './DayEntriesModal';
import { UNASSIGNED_TASK_ID } from './TaskFilter';

// Unified dialog state - eliminates state explosion and race conditions
type DialogState =
  | { type: 'closed' }
  | { type: 'create'; date: Date }
  | { type: 'edit'; entry: Entry }
  | { type: 'day-list'; date: Date; entries: Entry[] };

export function CalendarView() {
  const { viewingMonth, goToToday, goToPrevMonth, goToNextMonth } = useCalendar();
  const [dialog, setDialog] = useState<DialogState>({ type: 'closed' });
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Fetch calendars and auto-select default
  useCalendars();
  const currentCalendarId = useCalendarStore((state) => state.currentCalendarId);

  // WebSocket connection is now managed at app level via WebSocketProvider

  // Fetch entries for current view
  const { start_date, end_date } = useMemo(() => {
    switch (viewType) {
      case 'week': {
        const weekStart = startOfWeek(viewingMonth, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(viewingMonth, { weekStartsOn: 0 });
        return {
          start_date: formatDate(weekStart),
          end_date: formatDate(weekEnd),
        };
      }
      case 'day':
        return {
          start_date: formatDate(viewingMonth),
          end_date: formatDate(viewingMonth),
        };
      case 'month':
      default:
        return {
          start_date: formatDate(startOfMonth(viewingMonth)),
          end_date: formatDate(endOfMonth(viewingMonth)),
        };
    }
  }, [viewingMonth, viewType]);

  const { data: entries, isLoading, error } = useEntries(
    currentCalendarId
      ? {
          calendar_id: currentCalendarId,
          has_timestamp: true,
          start_date,
          end_date,
        }
      : undefined
  );

  // Fetch tasks for task badges
  const { data: tasksResponse } = useTasks(
    currentCalendarId ? { calendar_id: currentCalendarId } : undefined
  );
  const tasks = tasksResponse?.tasks || [];

  // Calculate unassigned entries count
  const unassignedCount = useMemo(() => {
    if (!entries) return 0;
    return entries.filter(entry => !entry.task_id).length;
  }, [entries]);

  // Filter entries by selected tasks
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (selectedTaskIds.size === 0) return entries;

    // Filter by selected tasks + unassigned (if selected)
    return entries.filter(entry => {
      if (!entry.task_id) {
        // Unassigned entry - only show if UNASSIGNED_TASK_ID is selected
        return selectedTaskIds.has(UNASSIGNED_TASK_ID);
      }
      // Regular entry - show if its task is selected
      return selectedTaskIds.has(entry.task_id);
    });
  }, [entries, selectedTaskIds]);

  // Group entries by date for DayEntriesModal
  const entriesByDate = useMemo(
    () => groupEntriesByDate(filteredEntries),
    [filteredEntries]
  );

  const handleDateClick = useCallback((date: Date) => {
    setDialog({ type: 'create', date });
  }, []);

  const handleTimeSlotClick = useCallback((date: Date, hour: number) => {
    // Create entry with specific hour
    const dateWithHour = new Date(date);
    dateWithHour.setHours(hour, 0, 0, 0);
    setDialog({ type: 'create', date: dateWithHour });
  }, []);

  const handleEntryClick = useCallback((entry: Entry) => {
    setDialog({ type: 'edit', entry });
  }, []);

  const handleShowMore = useCallback((date: Date) => {
    const dateEntries = entriesByDate[formatDate(date)] || [];
    setDialog({ type: 'day-list', date, entries: dateEntries });
  }, [entriesByDate]);

  const handleDialogClose = useCallback(() => {
    setDialog({ type: 'closed' });
  }, []);

  const handleCreateFromDayList = useCallback(() => {
    if (dialog.type === 'day-list') {
      setDialog({ type: 'create', date: dialog.date });
    }
  }, [dialog]);

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        currentMonth={viewingMonth}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
        viewType={viewType}
        onViewTypeChange={setViewType}
        tasks={tasks}
        unassignedCount={unassignedCount}
        selectedTaskIds={selectedTaskIds}
        onTaskFilterChange={setSelectedTaskIds}
      />

      {/* Render different views based on viewType */}
      {viewType === 'month' && (
        <CalendarGrid
          month={viewingMonth}
          entries={filteredEntries}
          tasks={tasks}
          onDateClick={handleDateClick}
          onEntryClick={handleEntryClick}
          onShowMore={handleShowMore}
          isLoading={isLoading}
          error={error || undefined}
        />
      )}

      {viewType === 'week' && (
        <WeekView
          week={viewingMonth}
          entries={filteredEntries}
          tasks={tasks}
          onTimeSlotClick={handleTimeSlotClick}
          onEntryClick={handleEntryClick}
          isLoading={isLoading}
        />
      )}

      {viewType === 'day' && (
        <DayView
          day={viewingMonth}
          entries={filteredEntries}
          tasks={tasks}
          onTimeSlotClick={handleTimeSlotClick}
          onEntryClick={handleEntryClick}
          isLoading={isLoading}
        />
      )}

      <EntryDialog
        open={dialog.type === 'create' || dialog.type === 'edit'}
        onOpenChange={(open) => !open && handleDialogClose()}
        entry={dialog.type === 'edit' ? dialog.entry : undefined}
        defaultDate={dialog.type === 'create' ? dialog.date : undefined}
        calendarId={currentCalendarId || ''}
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
