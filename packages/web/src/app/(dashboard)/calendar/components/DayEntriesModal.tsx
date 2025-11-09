'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import type { Entry } from '@calenote/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils/calendar';
import { parseISO } from 'date-fns';
import { useToggleEntryComplete } from '@/lib/hooks/useEntries';
import { cn } from '@/lib/utils';

interface DayEntriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  entries: Entry[];
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

function getPriorityColor(priority?: number): string {
  switch (priority) {
    case 3:
      return 'border-l-red-500';
    case 2:
      return 'border-l-yellow-500';
    case 1:
      return 'border-l-green-500';
    default:
      return 'border-l-gray-300';
  }
}

export function DayEntriesModal({
  open,
  onOpenChange,
  date,
  entries,
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
      await toggleComplete.mutateAsync(entry.id);
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

              return (
                <button
                  key={entry.id}
                  onClick={() => {
                    onOpenChange(false);
                    onEntryClick(entry);
                  }}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border-l-4 transition-colors',
                    'hover:bg-accent hover:shadow-sm',
                    getPriorityColor(entry.priority),
                    entry.is_completed && 'opacity-60'
                  )}
                  style={{
                    backgroundColor: entry.color
                      ? `${entry.color}15`
                      : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => handleToggleComplete(entry, e)}
                      className="mt-1 flex-shrink-0"
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{icon}</span>
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
                      </div>
                      <h4
                        className={cn(
                          'font-medium',
                          entry.is_completed && 'line-through'
                        )}
                      >
                        {entry.title}
                      </h4>
                      {entry.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {entry.content}
                        </p>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
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
