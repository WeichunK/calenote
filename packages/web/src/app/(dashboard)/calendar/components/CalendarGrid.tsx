import type { Entry } from '@calenote/shared';
import { getMonthDays, groupEntriesByDate, formatDate, isSameMonth, isToday, WEEKDAYS } from '@/lib/utils/calendar';
import { CalendarCell } from './CalendarCell';
import { CalendarSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle, Calendar } from 'lucide-react';

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
