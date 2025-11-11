'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import type { Entry, Task } from '@calenote/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils/calendar';
import { parseISO } from 'date-fns';
import { useToggleEntryComplete } from '@/lib/hooks/useEntries';
import { cn } from '@/lib/utils';
import { CheckSquare } from 'lucide-react';
import { getPriorityDotColor, getPriorityBorderColor, getPriorityLabel } from '@/lib/utils/priority';

interface DayEntriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  entries: Entry[];
  tasks?: Task[];
  onEntryClick: (entry: Entry) => void;
  onCreateEntry: () => void;
}

function getEntryTypeIcon(type: string): string {
  switch (type) {
    case 'event':
      return '📅';
    case 'reminder':
      return '⏰';
    case 'note':
      return '📝';
    default:
      return '📄';
  }
}

export function DayEntriesModal({
  open,
  onOpenChange,
  date,
  entries,
  tasks = [],
  onEntryClick,
  onCreateEntry,
}: DayEntriesModalProps) {
  const toggleComplete = useToggleEntryComplete();

  // Memoize sorting to avoid recreating array on every render
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      // Sort: incomplete first, then by time
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      if (a.timestamp && b.timestamp) {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return (b.priority || 0) - (a.priority || 0);
    });
  }, [entries]);

  const handleToggleComplete = async (entry: Entry, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleComplete.mutateAsync({
        id: entry.id,
        isCompleted: !entry.is_completed,
      });
    } catch (error) {
      console.error('Failed to toggle entry completion:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{format(date, 'EEEE, MMMM d, yyyy')}</DialogTitle>
          <DialogDescription>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} on this day
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {sortedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No entries on this day
            </div>
          ) : (
            sortedEntries.map((entry) => {
              const icon = getEntryTypeIcon(entry.entry_type);
              const time = entry.timestamp && !entry.is_all_day
                ? formatTime(parseISO(entry.timestamp))
                : null;
              const task = entry.task_id ? tasks.find(t => t.id === entry.task_id) : undefined;

              return (
                <div
                  key={entry.id}
                  data-testid="modal-entry"
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-l-4 transition-all',
                    'hover:bg-accent hover:shadow-md cursor-pointer group',
                    getPriorityBorderColor(entry.priority),
                    entry.is_completed && 'opacity-60'
                  )}
                  style={{
                    backgroundColor: entry.color
                      ? `${entry.color}15`
                      : undefined,
                  }}
                  onClick={() => {
                    onOpenChange(false);
                    onEntryClick(entry);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      data-testid="entry-checkbox"
                      onClick={(e) => handleToggleComplete(entry, e)}
                      className="mt-1 flex-shrink-0"
                      type="button"
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          entry.is_completed
                            ? 'bg-primary border-primary'
                            : 'border-gray-300 hover:border-primary'
                        )}
                      >
                        {entry.is_completed && (
                          <svg
                            className="w-3 h-3 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>

                    {/* Entry Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header Row with metadata */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-lg">{icon}</span>

                        {/* Priority Indicator */}
                        {entry.priority && entry.priority > 0 && (
                          <span className="flex items-center">
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                getPriorityDotColor(entry.priority)
                              )}
                              aria-hidden="true"
                            />
                            <span className="sr-only">Priority: {getPriorityLabel(entry.priority)}</span>
                          </span>
                        )}

                        {time && (
                          <span className="text-sm font-medium text-muted-foreground">
                            {time}
                          </span>
                        )}
                        {entry.is_all_day && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                            All day
                          </span>
                        )}

                        {/* Task Badge */}
                        {task && (
                          <Badge
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                            style={{
                              borderColor: task.color,
                              color: task.color
                            }}
                          >
                            <CheckSquare className="h-3 w-3" />
                            {task.icon && <span>{task.icon}</span>}
                            <span className="truncate max-w-[120px]">{task.title}</span>
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        className={cn(
                          'font-semibold text-base mb-1',
                          entry.is_completed && 'line-through'
                        )}
                      >
                        {entry.title}
                      </h4>

                      {/* Content Preview */}
                      {entry.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {entry.content}
                        </p>
                      )}

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onCreateEntry();
            }}
          >
            Add Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
