import type { Entry, Task } from '@calenote/shared';
import { cn } from '@/lib/utils';
import { getEntryTypeIcon, formatTime, parseISO } from '@/lib/utils/calendar';
import { getPriorityDotColor, getPriorityLabel } from '@/lib/utils/priority';

interface EntryBadgeProps {
  entry: Entry;
  task?: Task;
  onClick: (entry: Entry) => void;
  compact?: boolean;
}

export function EntryBadge({ entry, task, onClick, compact = false }: EntryBadgeProps) {
  const icon = getEntryTypeIcon(entry.entry_type);
  const time = entry.timestamp ? formatTime(parseISO(entry.timestamp)) : '';
  const priorityDotColor = getPriorityDotColor(entry.priority);

  return (
    <button
      data-testid="entry-badge"
      onClick={(e) => {
        e.stopPropagation();
        onClick(entry);
      }}
      className={cn(
        'w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors relative flex items-center gap-1',
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
      <span className="flex-shrink-0">{icon}</span>
      {priorityDotColor && (
        <span className="flex items-center">
          <span
            className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', priorityDotColor)}
            aria-hidden="true"
          />
          <span className="sr-only">Priority: {getPriorityLabel(entry.priority)}</span>
        </span>
      )}
      {!entry.is_all_day && time && <span className="font-medium flex-shrink-0">{time}</span>}
      {task && task.icon && <span className="flex-shrink-0">{task.icon}</span>}
      <span className="truncate flex-1 min-w-0">{entry.title}</span>
      {entry.created_by_user && (
        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-1">
          @{entry.created_by_user.username}
        </span>
      )}
    </button>
  );
}
