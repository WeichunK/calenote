import type { Entry } from '@calenote/shared';
import { getMonthDays, groupEntriesByDate, formatDate, isSameMonth, isToday, WEEKDAYS } from '@/lib/utils/calendar';
import { CalendarCell } from './CalendarCell';

interface CalendarGridProps {
  month: Date;
  entries: Entry[];
  onDateClick: (date: Date) => void;
  onEntryClick: (entry: Entry) => void;
  onShowMore?: (date: Date) => void;
  isLoading?: boolean;
  error?: Error;
}

export function CalendarGrid({
  month,
  entries,
  onDateClick,
  onEntryClick,
  onShowMore,
  isLoading,
  error,
}: CalendarGridProps) {
  const days = getMonthDays(month);
  const entriesByDate = groupEntriesByDate(entries);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Failed to load entries. Please try again.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
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

          return (
            <CalendarCell
              key={dateStr}
              date={date}
              isCurrentMonth={isSameMonth(date, month)}
              isToday={isToday(date)}
              entries={entriesByDate[dateStr] || []}
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
