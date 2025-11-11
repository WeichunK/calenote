import type { Entry, Task } from '@calenote/shared';
import { cn } from '@/lib/utils';
import { getEntryTypeIcon, formatTime, parseISO } from '@/lib/utils/calendar';

interface EntryBadgeProps {
  entry: Entry;
  task?: Task;
  onClick: (entry: Entry) => void;
  compact?: boolean;
}

export function EntryBadge({ entry, task, onClick, compact = false }: EntryBadgeProps) {
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
        'w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors relative',
        'hover:bg-accent hover:text-accent-foreground',
        entry.is_completed && 'opacity-50 line-through',
        compact && 'text-[10px]',
        task && 'border-l-2'
      )}
      style={{
        backgroundColor: entry.color || undefined,
        borderLeftColor: task?.color || undefined,
      }}
      title={task ? `Task: ${task.title}` : undefined}
    >
      <span className="mr-1">{icon}</span>
      {!entry.is_all_day && time && <span className="mr-1 font-medium">{time}</span>}
      {task && task.icon && <span className="mr-0.5">{task.icon}</span>}
      <span className="truncate">{entry.title}</span>
    </button>
  );
}
