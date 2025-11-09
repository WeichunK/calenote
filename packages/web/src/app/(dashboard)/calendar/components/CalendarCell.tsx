import type { Entry } from '@calenote/shared';
import { cn } from '@/lib/utils';
import { EntryBadge } from './EntryBadge';

interface CalendarCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  entries: Entry[];
  onDateClick: (date: Date) => void;
  onEntryClick: (entry: Entry) => void;
  onShowMore?: (date: Date) => void;
}

export function CalendarCell({
  date,
  isCurrentMonth,
  isToday,
  entries,
  onDateClick,
  onEntryClick,
  onShowMore,
}: CalendarCellProps) {
  // Entries are already sorted in groupEntriesByDate
  const maxDisplay = 3;
  const displayEntries = entries.slice(0, maxDisplay);
  const remaining = entries.length - maxDisplay;

  return (
    <div
      data-testid="calendar-cell"
      data-date={date.toISOString()}
      className={cn(
        'border-r border-b p-1 sm:p-2 h-24 sm:h-32',
        'cursor-pointer hover:bg-accent/50 transition-colors',
        'flex flex-col',
        !isCurrentMonth && 'bg-muted/30 text-muted-foreground'
      )}
      onClick={() => onDateClick(date)}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            isToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
          )}
        >
          {date.getDate()}
        </span>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-hidden space-y-0.5">
        {displayEntries.map((entry) => (
          <EntryBadge key={entry.id} entry={entry} onClick={onEntryClick} />
        ))}

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
}
