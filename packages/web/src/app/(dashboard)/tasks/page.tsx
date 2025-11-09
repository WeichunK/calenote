'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@calenote/shared';
import { useCalendars } from '@/lib/hooks/useCalendars';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskDialog } from '@/components/tasks/TaskDialog';

export default function TasksPage() {
  const router = useRouter();
  const { currentCalendar } = useCalendars();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // WebSocket connection is now managed at app level via WebSocketProvider

  const handleCreateTask = () => {
    setSelectedTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    // Navigate to task detail view
    router.push(`/tasks/${task.id}`);
  };

  const handleAddEntryToTask = (taskId: string) => {
    // TODO: Open EntryDialog with task_id pre-filled
    console.log('Add entry to task:', taskId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          Track your projects and progress
        </p>
      </div>

      <TaskBoard
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
        onTaskClick={handleTaskClick}
        onAddEntryToTask={handleAddEntryToTask}
      />

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}
