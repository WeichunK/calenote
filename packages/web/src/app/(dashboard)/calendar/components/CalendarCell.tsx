import { memo } from 'react';
import type { Entry, Task } from '@calenote/shared';
import type { HolidayData } from '@/types/holiday';
import { cn } from '@/lib/utils';
import { isMakeupWorkday } from '@/lib/utils/holidays';
import { EntryBadge } from './EntryBadge';

interface CalendarCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  entries: Entry[];
  taskMap: Map<string, Task>;
  holiday?: HolidayData;
  onDateClick: (date: Date) => void;
  onEntryClick: (entry: Entry) => void;
  onShowMore?: (date: Date) => void;
}

export const CalendarCell = memo(function CalendarCell({
  date,
  isCurrentMonth,
  isToday,
  entries,
  taskMap,
  holiday,
  onDateClick,
  onEntryClick,
  onShowMore,
}: CalendarCellProps) {
  // Entries are already sorted in groupEntriesByDate
  const maxDisplay = 3;
  const displayEntries = entries.slice(0, maxDisplay);
  const remaining = entries.length - maxDisplay;

  // Determine holiday styling
  const isPublicHoliday = holiday?.isHoliday === true;
  const isMakeupWorkdayDate = isMakeupWorkday(holiday);

  return (
    <div
      data-testid="calendar-cell"
      data-date={date.toISOString()}
      className={cn(
        'border-r border-b p-1 sm:p-2 h-24 sm:h-32',
        'cursor-pointer hover:bg-accent/50 transition-colors',
        'flex flex-col',
        !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
        isPublicHoliday && 'bg-red-50 dark:bg-red-950/20'
      )}
      onClick={() => onDateClick(date)}
    >
      {/* Day number with holiday indicator */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-0.5">
          <span
            className={cn(
              'text-sm font-medium',
              isToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center',
              isPublicHoliday && 'text-red-600 dark:text-red-400 font-semibold',
              isMakeupWorkdayDate && 'text-orange-600 dark:text-orange-400'
            )}
          >
            {date.getDate()}
          </span>

          {/* Emoji indicators */}
          {isPublicHoliday && (
            <span className="text-xs" title={holiday?.description}>
              🎌
            </span>
          )}
          {isMakeupWorkdayDate && (
            <span className="text-xs" title={holiday?.description}>
              ⚠️
            </span>
          )}
        </div>
      </div>

      {/* Holiday name (optional, shows below day number) */}
      {holiday?.description && (
        <div
          className={cn(
            'text-[10px] sm:text-xs truncate mb-0.5',
            isPublicHoliday && 'text-red-600 dark:text-red-400',
            isMakeupWorkdayDate && 'text-orange-600 dark:text-orange-400'
          )}
          title={holiday.description}
        >
          {holiday.description}
        </div>
      )}

      {/* Entries */}
      <div className="flex-1 overflow-hidden space-y-0.5">
        {displayEntries.map((entry) => {
          const task = entry.task_id ? taskMap.get(entry.task_id) : undefined;
          return (
            <div key={entry.id}>
              {/* Desktop */}
              <div className="hidden sm:block">
                <EntryBadge entry={entry} task={task} onClick={onEntryClick} />
              </div>
              {/* Mobile - compact mode */}
              <div className="sm:hidden">
                <EntryBadge entry={entry} task={task} onClick={onEntryClick} compact />
              </div>
            </div>
          );
        })}

        {remaining > 0 && onShowMore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowMore(date);
            }}
            className="w-full text-left px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            +{remaining} more
          </button>
        )}
      </div>
    </div>
  );
});
