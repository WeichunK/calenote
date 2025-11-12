import { useMemo } from 'react';
import type { Entry, Task } from '@calenote/shared';
import type { HolidayMap } from '@/types/holiday';
import { getMonthDays, groupEntriesByDate, formatDate, isSameMonth, isToday, WEEKDAYS } from '@/lib/utils/calendar';
import { formatDateToHolidayKey } from '@/lib/utils/holidays';
import { CalendarCell } from './CalendarCell';
import { CalendarSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle, Calendar } from 'lucide-react';

interface CalendarGridProps {
  month: Date;
  entries: Entry[];
  tasks: Task[];
  holidayMap: HolidayMap;
  onDateClick: (date: Date) => void;
  onEntryClick: (entry: Entry) => void;
  onShowMore?: (date: Date) => void;
  isLoading?: boolean;
  error?: Error;
}

export function CalendarGrid({
  month,
  entries,
  tasks,
  holidayMap,
  onDateClick,
  onEntryClick,
  onShowMore,
  isLoading,
  error,
}: CalendarGridProps) {
  const days = useMemo(() => getMonthDays(month), [month]);
  const entriesByDate = useMemo(() => groupEntriesByDate(entries), [entries]);

  // Create task lookup map
  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach(task => {
      map.set(task.id, task);
    });
    return map;
  }, [tasks]);

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load calendar"
        description="We couldn't load your entries. Please try again."
      />
    );
  }

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="border-l border-t">
      {/* Weekday headers */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="border-r border-b bg-muted p-2 text-center text-sm font-medium"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const dateStr = formatDate(date);
          const holidayKey = formatDateToHolidayKey(date);
          const holiday = holidayMap[holidayKey];

          return (
            <CalendarCell
              key={dateStr}
              date={date}
              isCurrentMonth={isSameMonth(date, month)}
              isToday={isToday(date)}
              entries={entriesByDate[dateStr] || []}
              taskMap={taskMap}
              holiday={holiday}
              onDateClick={onDateClick}
              onEntryClick={onEntryClick}
              onShowMore={onShowMore}
            />
          );
        })}
      </div>
    </div>
  );
}
