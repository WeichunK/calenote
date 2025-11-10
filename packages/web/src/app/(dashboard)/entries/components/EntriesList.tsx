'use client';

import { useMemo, memo, useCallback } from 'react';
import { format, parseISO, isToday, isThisWeek, isPast, isFuture } from 'date-fns';
import type { Entry } from '@calenote/shared';
import { cn } from '@/lib/utils';
import { useToggleEntryComplete } from '@/lib/hooks/useEntries';

interface EntriesListProps {
  entries: Entry[];
  onEntryClick: (entry: Entry) => void;
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
}

const EntryItem = memo(function EntryItem({ entry, onEntryClick, onToggleComplete }: EntryItemProps) {
  const icon = getEntryTypeIcon(entry.entry_type);
  const time = entry.timestamp && !entry.is_all_day
    ? format(parseISO(entry.timestamp), 'MMM d, yyyy h:mm a')
    : entry.timestamp
    ? format(parseISO(entry.timestamp), 'MMM d, yyyy')
    : null;

  return (
    <div
      data-testid="entry-item"
      className={cn(
        'p-4 rounded-lg border-l-4 transition-colors cursor-pointer',
        'hover:bg-accent hover:shadow-sm',
        getPriorityColor(entry.priority),
        entry.is_completed && 'opacity-60'
      )}
      style={{
        backgroundColor: entry.color
          ? `${entry.color}15`
          : undefined,
      }}
      onClick={() => onEntryClick(entry)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          data-testid="entry-checkbox"
          onClick={(e) => onToggleComplete(entry, e)}
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
            {entry.priority !== undefined && entry.priority > 0 && (
              <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded">
                {entry.priority === 3 && '🔴 High'}
                {entry.priority === 2 && '🟡 Medium'}
                {entry.priority === 1 && '🟢 Low'}
              </span>
            )}
          </div>

          <h4
            className={cn(
              'font-medium text-base',
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
    </div>
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

export function EntriesList({ entries, onEntryClick, groupBy = 'none' }: EntriesListProps) {
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
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No entries found</p>
        <p className="text-sm mt-2">Try adjusting your filters or create a new entry</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedEntries).map(([groupLabel, groupEntries]) => {
        if (groupEntries.length === 0) return null;

        return (
          <div key={groupLabel}>
            {groupBy !== 'none' && (
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {groupLabel} ({groupEntries.length})
              </h3>
            )}

            <div className="space-y-2">
              {groupEntries.map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  onEntryClick={onEntryClick}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
