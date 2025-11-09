'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import type { Task } from '@calenote/shared';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCard } from './TaskCard';
import { useTasks, useDeleteTask } from '@/lib/hooks/useTasks';
import { useCalendars } from '@/lib/hooks/useCalendars';
import { useToast } from '@/hooks/use-toast';

interface TaskBoardProps {
  onCreateTask?: () => void;
  onEditTask?: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  onAddEntryToTask?: (taskId: string) => void;
}

export function TaskBoard({
  onCreateTask,
  onEditTask,
  onTaskClick,
  onAddEntryToTask,
}: TaskBoardProps) {
  const { currentCalendar } = useCalendars();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');

  // Fetch tasks
  const { data: tasks, isLoading, error } = useTasks({
    calendar_id: currentCalendar?.id,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  // Delete task mutation
  const deleteTask = useDeleteTask();

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? All entries will be unlinked.')) {
      return;
    }

    try {
      await deleteTask.mutateAsync(taskId);
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive p-8 text-center">
        <p className="text-destructive">Failed to load tasks</p>
        <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm">Done</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs sm:text-sm">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={onCreateTask} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="sm:inline">New Task</span>
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!tasks || tasks.length === 0) && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first task to organize your entries
          </p>
          <Button onClick={onCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      )}

      {/* Tasks Grid */}
      {!isLoading && tasks && tasks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={handleDeleteTask}
              onAddEntry={onAddEntryToTask}
              onClick={onTaskClick}
            />
          ))}
        </div>
      )}

      {/* Task Count */}
      {!isLoading && tasks && tasks.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {tasks.length} {statusFilter === 'all' ? '' : statusFilter} task{tasks.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
