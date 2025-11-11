'use client';

import { useMemo, memo, useCallback } from 'react';
import { format, parseISO, isToday, isThisWeek, isPast, isFuture } from 'date-fns';
import { MoreVertical, Plus, Unlink, Edit } from 'lucide-react';
import type { Entry } from '@calenote/shared';
import { cn } from '@/lib/utils';
import { useToggleEntryComplete } from '@/lib/hooks/useEntries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TYPOGRAPHY, SPACING, INTERACTIVE, VISUAL } from '@/lib/design/tokens';

interface EntriesListProps {
  entries: Entry[];
  onEntryClick: (entry: Entry) => void;
  onAddToTask?: (entry: Entry) => void;
  onRemoveFromTask?: (entry: Entry) => void;
  groupBy?: 'none' | 'date' | 'status';
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

// Memoized Entry Item Component
interface EntryItemProps {
  entry: Entry;
  onEntryClick: (entry: Entry) => void;
  onToggleComplete: (entry: Entry, e: React.MouseEvent) => Promise<void>;
  onAddToTask?: (entry: Entry) => void;
  onRemoveFromTask?: (entry: Entry) => void;
}

const EntryItem = memo(function EntryItem({ entry, onEntryClick, onToggleComplete, onAddToTask, onRemoveFromTask }: EntryItemProps) {
  const icon = getEntryTypeIcon(entry.entry_type);
  const time = entry.timestamp && !entry.is_all_day
    ? format(parseISO(entry.timestamp), 'MMM d, yyyy h:mm a')
    : entry.timestamp
    ? format(parseISO(entry.timestamp), 'MMM d, yyyy')
    : null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on dropdown or checkbox
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') ||
        (e.target as HTMLElement).closest('[data-testid="entry-checkbox"]')) {
      return;
    }
    onEntryClick(entry);
  };

  return (
    <Card
      data-testid="entry-item"
      className={cn(
        'cursor-pointer transition-all duration-200',
        VISUAL.border.accent,
        getPriorityColor(entry.priority),
        entry.is_completed && 'opacity-60',
        'hover:shadow-md hover:scale-[1.005]'
      )}
      style={{
        backgroundColor: entry.color ? `${entry.color}08` : undefined,
      }}
      onClick={handleCardClick}
    >
      <CardContent className={SPACING.card.padding}>
        <div className={cn('flex items-start', SPACING.inline.gap)}>
          {/* Checkbox */}
          <button
            data-testid="entry-checkbox"
            onClick={(e) => onToggleComplete(entry, e)}
            className="mt-1 flex-shrink-0"
            type="button"
            aria-label={entry.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <div
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150',
                entry.is_completed
                  ? 'bg-primary border-primary'
                  : 'border-gray-300 hover:border-primary hover:scale-110'
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
            {/* Metadata row */}
            <div className={cn('flex items-center flex-wrap', SPACING.inline.gapSmall, 'mb-2')}>
              <span className="text-lg" aria-label={`${entry.entry_type} type`}>{icon}</span>
              {time && (
                <span className={TYPOGRAPHY.smallMuted}>
                  {time}
                </span>
              )}
              {entry.is_all_day && (
                <Badge variant="secondary" className="text-xs">
                  All day
                </Badge>
              )}
              {entry.priority !== undefined && entry.priority > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    entry.priority === 3 && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    entry.priority === 2 && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    entry.priority === 1 && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  )}
                >
                  {entry.priority === 3 && 'High Priority'}
                  {entry.priority === 2 && 'Medium'}
                  {entry.priority === 1 && 'Low'}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h4
              className={cn(
                TYPOGRAPHY.cardTitle,
                entry.is_completed && 'line-through text-muted-foreground'
              )}
            >
              {entry.title}
            </h4>

            {/* Description */}
            {entry.content && (
              <p className={cn(TYPOGRAPHY.smallMuted, 'mt-1.5 line-clamp-2')}>
                {entry.content}
              </p>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className={cn('flex flex-wrap', SPACING.inline.gapSmall, 'mt-2')}>
                {entry.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={TYPOGRAPHY.caption}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions Dropdown */}
          {(onAddToTask || onRemoveFromTask) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  data-dropdown-trigger
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEntryClick(entry)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Entry
                </DropdownMenuItem>
                {onAddToTask && !entry.task_id && (
                  <DropdownMenuItem onClick={() => onAddToTask(entry)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Task
                  </DropdownMenuItem>
                )}
                {onRemoveFromTask && entry.task_id && (
                  <DropdownMenuItem onClick={() => onRemoveFromTask(entry)}>
                    <Unlink className="h-4 w-4 mr-2" />
                    Remove from Task
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

function getDateGroupLabel(entry: Entry): string {
  if (!entry.timestamp) return 'Unscheduled';

  const date = parseISO(entry.timestamp);
  if (isToday(date)) return 'Today';
  if (isThisWeek(date)) {
    if (isPast(date)) return 'Earlier this week';
    return 'This week';
  }
  if (isPast(date)) return 'Past';
  if (isFuture(date)) return 'Upcoming';

  return format(date, 'MMMM yyyy');
}

export function EntriesList({ entries, onEntryClick, onAddToTask, onRemoveFromTask, groupBy = 'none' }: EntriesListProps) {
  const toggleComplete = useToggleEntryComplete();

  const groupedEntries = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Entries': entries };
    }

    if (groupBy === 'status') {
      const groups: Record<string, Entry[]> = {
        'Active': [],
        'Completed': [],
      };

      entries.forEach(entry => {
        if (entry.is_completed) {
          groups['Completed'].push(entry);
        } else {
          groups['Active'].push(entry);
        }
      });

      return groups;
    }

    // groupBy === 'date'
    const groups: Record<string, Entry[]> = {};

    entries.forEach(entry => {
      const label = getDateGroupLabel(entry);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(entry);
    });

    // Sort groups: Unscheduled, Today, This week, Upcoming, Past
    const groupOrder = ['Unscheduled', 'Today', 'This week', 'Earlier this week', 'Upcoming', 'Past'];
    const sortedGroups: Record<string, Entry[]> = {};

    groupOrder.forEach(key => {
      if (groups[key]) {
        sortedGroups[key] = groups[key];
      }
    });

    // Add remaining groups (month groups)
    Object.keys(groups).forEach(key => {
      if (!groupOrder.includes(key)) {
        sortedGroups[key] = groups[key];
      }
    });

    return sortedGroups;
  }, [entries, groupBy]);

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

  if (entries.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className={cn(TYPOGRAPHY.cardTitle, 'text-muted-foreground')}>No entries found</p>
          <p className={cn(TYPOGRAPHY.smallMuted, 'mt-2')}>
            Try adjusting your filters or create a new entry
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={SPACING.section.gap}>
      {Object.entries(groupedEntries).map(([groupLabel, groupEntries]) => {
        if (groupEntries.length === 0) return null;

        return (
          <div key={groupLabel} className={SPACING.section.gapSmall}>
            {groupBy !== 'none' && (
              <h3 className={cn(TYPOGRAPHY.small, 'font-semibold text-muted-foreground mb-3 uppercase tracking-wide')}>
                {groupLabel} ({groupEntries.length})
              </h3>
            )}

            <div className={SPACING.section.gapSmall}>
              {groupEntries.map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  onEntryClick={onEntryClick}
                  onToggleComplete={handleToggleComplete}
                  onAddToTask={onAddToTask}
                  onRemoveFromTask={onRemoveFromTask}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
