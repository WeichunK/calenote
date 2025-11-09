import type { Entry } from '@calenote/shared';
import { cn } from '@/lib/utils';
import { getEntryTypeIcon, formatTime, parseISO } from '@/lib/utils/calendar';

interface EntryBadgeProps {
  entry: Entry;
  onClick: (entry: Entry) => void;
  compact?: boolean;
}

export function EntryBadge({ entry, onClick, compact = false }: EntryBadgeProps) {
  const icon = getEntryTypeIcon(entry.entry_type);
  const time = entry.timestamp ? formatTime(parseISO(entry.timestamp)) : '';

  return (
    <button
      data-testid="entry-badge"
      onClick={(e) => {
        e.stopPropagation();
        onClick(entry);
      }}
      className={cn(
        'w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        entry.is_completed && 'opacity-50 line-through',
        compact && 'text-[10px]'
      )}
      style={{ backgroundColor: entry.color || undefined }}
    >
      <span className="mr-1">{icon}</span>
      {!entry.is_all_day && time && <span className="mr-1 font-medium">{time}</span>}
      <span className="truncate">{entry.title}</span>
    </button>
  );
}
