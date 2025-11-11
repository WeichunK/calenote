'use client';

import { useState } from 'react';
import { Check, Filter, X } from 'lucide-react';
import type { Task } from '@calenote/shared';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskFilterProps {
  tasks: Task[];
  selectedTaskIds: Set<string>;
  onSelectionChange: (taskIds: Set<string>) => void;
}

export function TaskFilter({ tasks, selectedTaskIds, onSelectionChange }: TaskFilterProps) {
  const [open, setOpen] = useState(false);

  const activeTasks = tasks.filter((task) => task.status === 'active');
  const selectedCount = selectedTaskIds.size;
  const hasSelection = selectedCount > 0;

  const toggleTask = (taskId: string) => {
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    onSelectionChange(newSelection);
  };

  const clearAll = () => {
    onSelectionChange(new Set());
  };

  const selectAll = () => {
    onSelectionChange(new Set(activeTasks.map(t => t.id)));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasSelection ? 'default' : 'outline'}
          size="sm"
          className={cn('gap-2', hasSelection && 'pr-1')}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">
            {hasSelection ? `${selectedCount} Task${selectedCount > 1 ? 's' : ''}` : 'Filter Tasks'}
          </span>
          <span className="sm:hidden">
            {hasSelection ? selectedCount : 'Filter'}
          </span>
          {hasSelection && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 w-5 p-0 flex items-center justify-center cursor-pointer hover:bg-secondary/80"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
            >
              <X className="h-3 w-3" />
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h4 className="font-medium text-sm">Filter by Task</h4>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={selectAll}
              disabled={selectedCount === activeTasks.length}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={clearAll}
              disabled={!hasSelection}
            >
              Clear
            </Button>
          </div>
        </div>

        {activeTasks.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No active tasks available
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto p-2">
            <div className="space-y-1">
              {activeTasks.map((task) => {
                const isSelected = selectedTaskIds.has(task.id);
                return (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-md text-sm transition-colors',
                      'hover:bg-accent',
                      isSelected && 'bg-accent/50'
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>

                    {/* Task info */}
                    <div
                      className="flex-1 flex items-center gap-2 min-w-0 border-l-2 pl-2"
                      style={{ borderLeftColor: task.color || undefined }}
                    >
                      {task.icon && <span className="flex-shrink-0">{task.icon}</span>}
                      <span className="truncate font-medium">{task.title}</span>
                    </div>

                    {/* Entry count */}
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {task.total_entries} {task.total_entries === 1 ? 'entry' : 'entries'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
