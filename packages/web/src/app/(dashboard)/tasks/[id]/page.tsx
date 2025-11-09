'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Trash2, CheckCircle2, Circle, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTask, useDeleteTask } from '@/lib/hooks/useTasks';
import { useToggleEntryComplete } from '@/lib/hooks/useEntries';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Task } from '@calenote/shared';

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: task, isLoading, error } = useTask(resolvedParams.id);
  const deleteTask = useDeleteTask();
  const toggleComplete = useToggleEntryComplete();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? All entries will be unlinked.')) {
      return;
    }

    try {
      await deleteTask.mutateAsync(resolvedParams.id);
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
      router.push('/tasks');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEntry = async (entryId: string, isCompleted: boolean) => {
    try {
      await toggleComplete.mutateAsync({
        id: entryId,
        isCompleted: !isCompleted,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update entry',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/tasks')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
        <div className="rounded-lg border border-destructive p-8 text-center">
          <p className="text-destructive">Failed to load task</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-blue-500',
    completed: 'bg-green-500',
    archived: 'bg-gray-500',
    cancelled: 'bg-red-500',
  };

  const statusLabels = {
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
    cancelled: 'Cancelled',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/tasks')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Task Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {task.icon && <span className="text-4xl">{task.icon}</span>}
              <div>
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                {task.description && (
                  <p className="text-muted-foreground mt-2">{task.description}</p>
                )}
              </div>
            </div>

            <Badge
              variant="secondary"
              className={cn('capitalize', statusColors[task.status])}
            >
              {statusLabels[task.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {task.completed_entries}/{task.total_entries} entries completed
              </span>
            </div>
            <Progress value={task.completion_percentage} className="h-3" />
            <div className="text-sm text-muted-foreground text-right">
              {task.completion_percentage}% complete
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {task.due_date && (
              <div>
                <span className="text-muted-foreground">Due Date:</span>
                <div className={cn(
                  'font-medium mt-1',
                  new Date(task.due_date) < new Date() && task.status !== 'completed'
                    ? 'text-destructive'
                    : ''
                )}>
                  {format(new Date(task.due_date), 'PPP')}
                </div>
              </div>
            )}

            <div>
              <span className="text-muted-foreground">Created:</span>
              <div className="font-medium mt-1">
                {format(new Date(task.created_at), 'PPP')}
              </div>
            </div>

            {task.completed_at && (
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <div className="font-medium mt-1">
                  {format(new Date(task.completed_at), 'PPP')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entries Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Entries ({task.entries?.length || 0})</CardTitle>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!task.entries || task.entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No entries in this task yet
            </div>
          ) : (
            <div className="space-y-2">
              {task.entries.map((entry, index) => (
                <div key={entry.id}>
                  {index > 0 && <Separator className="my-2" />}
                  <div className="flex items-start gap-3 p-3 rounded hover:bg-accent transition-colors">
                    <button
                      onClick={() => handleToggleEntry(entry.id, entry.is_completed)}
                      className="mt-0.5"
                    >
                      {entry.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        'font-medium',
                        entry.is_completed && 'line-through text-muted-foreground'
                      )}>
                        {entry.title}
                      </h4>
                      {entry.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {entry.content}
                        </p>
                      )}
                      {entry.timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(entry.timestamp), 'PPp')}
                        </p>
                      )}
                    </div>

                    {entry.priority && (
                      <Badge variant="outline" className="capitalize">
                        {entry.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <TaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={task}
      />
    </div>
  );
}
