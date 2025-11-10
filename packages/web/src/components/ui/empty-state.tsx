/**
 * Empty State Component
 *
 * Provides engaging empty state UIs with icons, messages, and CTAs
 * to guide users when there's no content to display.
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ==================== BASE EMPTY STATE ====================

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in-up',
        className
      )}
    >
      {/* Icon */}
      <div className="rounded-full bg-muted p-6 mb-4 animate-scale-in animation-delay-100">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 animate-fade-in-up animation-delay-200">
        {title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-md animate-fade-in-up animation-delay-300">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animation-delay-300">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size="lg"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size="lg"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Custom children */}
      {children && (
        <div className="mt-6 animate-fade-in-up animation-delay-500">
          {children}
        </div>
      )}
    </div>
  );
}

// ==================== SPECIALIZED EMPTY STATES ====================

import {
  Calendar,
  FileText,
  CheckSquare,
  Search,
  Filter,
  Inbox,
  Archive,
  AlertCircle,
  Plus,
  Sparkles,
} from 'lucide-react';

/**
 * Empty calendar - no entries for selected date
 */
export function EmptyCalendar({ onCreateEntry }: { onCreateEntry: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No entries yet"
      description="Start organizing your day by creating your first entry. Track events, notes, and reminders all in one place."
      action={{
        label: 'Create Entry',
        onClick: onCreateEntry,
      }}
    />
  );
}

/**
 * Empty entries list - no entries at all
 */
export function EmptyEntriesList({ onCreateEntry }: { onCreateEntry: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No entries found"
      description="You haven't created any entries yet. Create your first entry to get started with your productivity journey."
      action={{
        label: 'Create First Entry',
        onClick: onCreateEntry,
      }}
    />
  );
}

/**
 * Empty search results
 */
export function EmptySearchResults({ query, onClearSearch }: { query: string; onClearSearch: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any entries matching "${query}". Try adjusting your search terms or filters.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'outline',
      }}
    />
  );
}

/**
 * Empty filtered results
 */
export function EmptyFilteredResults({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="No entries match your filters"
      description="Try adjusting your filters to see more results. You can clear all filters to see everything."
      action={{
        label: 'Clear Filters',
        onClick: onClearFilters,
        variant: 'outline',
      }}
    />
  );
}

/**
 * Empty tasks board
 */
export function EmptyTasksBoard({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      icon={CheckSquare}
      title="No tasks yet"
      description="Create your first task to start organizing your projects. Break down your work into manageable pieces and track your progress."
      action={{
        label: 'Create Task',
        onClick: onCreateTask,
      }}
    />
  );
}

/**
 * Empty task (no entries in task)
 */
export function EmptyTask({ onAddEntry }: { onAddEntry: () => void }) {
  return (
    <EmptyState
      icon={Inbox}
      title="No entries in this task"
      description="Add entries to break down this task into smaller steps. Track your progress as you complete each entry."
      action={{
        label: 'Add Entry',
        onClick: onAddEntry,
      }}
    />
  );
}

/**
 * Empty archived items
 */
export function EmptyArchive() {
  return (
    <EmptyState
      icon={Archive}
      title="No archived items"
      description="Items you archive will appear here. Archive completed tasks or old entries to keep your workspace clean."
    />
  );
}

/**
 * Empty inbox (unscheduled entries)
 */
export function EmptyInbox({ onCreateEntry }: { onCreateEntry: () => void }) {
  return (
    <EmptyState
      icon={Inbox}
      title="Inbox is empty"
      description="Great job! You've scheduled or completed all your entries. Create a new entry or take a well-deserved break."
      action={{
        label: 'Create Entry',
        onClick: onCreateEntry,
      }}
    >
      <div className="mt-4 text-4xl">🎉</div>
    </EmptyState>
  );
}

/**
 * Empty completed entries
 */
export function EmptyCompleted() {
  return (
    <EmptyState
      icon={CheckSquare}
      title="No completed entries"
      description="Completed entries will appear here. Check off entries as you complete them to track your accomplishments."
    />
  );
}

/**
 * Error state
 */
export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load your data. Please try again or contact support if the problem persists.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: 'Try Again',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}

/**
 * Loading empty state (for when data is still loading)
 */
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      <div className="relative">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Sparkles className="h-12 w-12 text-muted-foreground animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// ==================== COMPACT EMPTY STATES ====================

/**
 * Compact empty state for smaller containers
 */
export function CompactEmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: LucideIcon;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Inline empty state for lists
 */
export function InlineEmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-center animate-fade-in">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ==================== ILLUSTRATION VARIANTS ====================

/**
 * Empty state with custom illustration
 */
export function IllustratedEmptyState({
  illustration,
  title,
  description,
  action,
}: {
  illustration: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
      <div className="mb-6 animate-scale-in">{illustration}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}
    </div>
  );
}
