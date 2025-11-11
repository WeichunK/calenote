'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@calenote/shared';

interface AddToTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onSelectTask: (taskId: string) => void;
  isLoading?: boolean;
}

export function AddToTaskDialog({
  open,
  onOpenChange,
  tasks,
  onSelectTask,
  isLoading = false,
}: AddToTaskDialogProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedTaskId) {
      onSelectTask(selectedTaskId);
      setSelectedTaskId(null);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedTaskId(null);
    onOpenChange(false);
  };

  const activeTasks = tasks.filter((task) => task.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Entry to Task</DialogTitle>
          <DialogDescription>
            Select a task to add this entry to. Only active tasks are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto pr-4">
          {activeTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active tasks available.</p>
              <p className="text-sm mt-2">Create a task first to organize your entries.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border-2 transition-all',
                    'hover:bg-accent hover:border-primary/50',
                    selectedTaskId === task.id
                      ? 'border-primary bg-accent'
                      : 'border-transparent bg-muted/50'
                  )}
                  style={{
                    backgroundColor: task.color ? `${task.color}08` : undefined,
                    borderLeftColor: task.color || undefined,
                    borderLeftWidth: task.color ? '4px' : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {task.icon && <span className="text-lg">{task.icon}</span>}
                        <h4 className="font-medium truncate">{task.title}</h4>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {task.completed_entries}/{task.total_entries} entries •{' '}
                        {task.completion_percentage}% complete
                      </div>
                    </div>
                    {selectedTaskId === task.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTaskId || isLoading}
          >
            {isLoading ? 'Adding...' : 'Add to Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
