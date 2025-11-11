'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, CheckSquare, AlertCircle } from 'lucide-react';
import type { Task } from '@calenote/shared';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCard } from './TaskCard';
import { TaskCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useTasks, useDeleteTask } from '@/lib/hooks/useTasks';
import { useCalendars } from '@/lib/hooks/useCalendars';
import { useToast } from '@/hooks/use-toast';
import { staggerChildren } from '@/lib/animations/variants';

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

  // Fetch tasks (API returns {tasks: Task[], total: number})
  const { data: tasksResponse, isLoading, error } = useTasks({
    calendar_id: currentCalendar?.id,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  // Extract tasks array from paginated response
  const tasks = tasksResponse?.tasks || [];

  // Delete task mutation
  const deleteTask = useDeleteTask();

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? All entries will be unlinked.')) {
      return;
    }

    try {
      console.log('[TaskBoard] Deleting task:', taskId);
      await deleteTask.mutateAsync(taskId);
      console.log('[TaskBoard] Task deleted successfully');
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error: any) {
      console.error('[TaskBoard] Delete task error:', error);
      console.error('[TaskBoard] Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack,
      });
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load tasks"
        description={(error as Error).message || 'Please try again later.'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs value={statusFilter} onValueChange={(v: string) => setStatusFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm">Done</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs sm:text-sm">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        <AnimatedButton onClick={onCreateTask} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="sm:inline">New Task</span>
        </AnimatedButton>
      </div>

      {/* Loading State */}
      {isLoading && <TaskCardSkeleton />}

      {/* Empty State */}
      {!isLoading && (!tasks || tasks.length === 0) && (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description={`Create your first task to organize your ${statusFilter === 'all' ? '' : statusFilter + ' '}entries`}
          action={{
            label: 'Create Task',
            onClick: onCreateTask || (() => {}),
          }}
        />
      )}

      {/* Tasks Grid with Stagger Animation */}
      {!isLoading && tasks && tasks.length > 0 && (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
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
        </motion.div>
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
