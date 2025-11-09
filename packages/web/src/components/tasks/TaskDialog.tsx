'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@calenote/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreateTask, useUpdateTask } from '@/lib/hooks/useTasks';
import { useCalendars } from '@/lib/hooks/useCalendars';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null; // If provided, edit mode
}

/**
 * TaskDialog - Create/Edit Task Form
 *
 * Uses delta-based state pattern:
 * - Props (task) = source of truth (server data)
 * - State (editedFields) = user's uncommitted changes (deltas only)
 * - Display = merge(props, state)
 * - Save = send deltas to server (PATCH) or full object (POST)
 * - Reset = clear state
 *
 * This eliminates useEffect synchronization and prevents race conditions.
 */
export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const { currentCalendar } = useCalendars();
  const { toast } = useToast();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEdit = !!task;

  // Base data: from props (edit mode) or defaults (create mode)
  const baseData = task || {
    title: '',
    description: '',
    status: 'active' as const,
    color: '',
    icon: '',
    due_date: undefined,
  };

  // State: Only store what the user has changed (deltas)
  const [editedFields, setEditedFields] = useState<Partial<Task>>({});

  // Current display data: merge base + edits
  const currentData = { ...baseData, ...editedFields };

  // Generic field update handler
  const updateField = <K extends keyof Task>(field: K, value: Task[K]) => {
    setEditedFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentData.title?.trim()) {
      toast({
        title: 'Error',
        description: 'Task title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!currentCalendar) {
      toast({
        title: 'Error',
        description: 'No calendar selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEdit) {
        // PATCH: Send only changed fields
        const data: UpdateTaskDTO = {
          ...editedFields,
          title: editedFields.title ? editedFields.title.trim() : undefined,
          description: editedFields.description ? editedFields.description.trim() || undefined : undefined,
        };

        // Remove undefined values (don't send fields that weren't changed)
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined)
        ) as UpdateTaskDTO;

        await updateTask.mutateAsync({ id: task.id, data: cleanData });
        toast({
          title: 'Success',
          description: 'Task updated successfully',
        });
      } else {
        // POST: Send full object
        const data: CreateTaskDTO = {
          calendar_id: currentCalendar.id,
          title: currentData.title.trim(),
          description: currentData.description?.trim() || undefined,
          due_date: currentData.due_date,
          color: currentData.color || undefined,
          icon: currentData.icon || undefined,
        };

        await createTask.mutateAsync(data);
        toast({
          title: 'Success',
          description: 'Task created successfully',
        });
      }

      // Reset and close
      setEditedFields({});
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: isEdit ? 'Failed to update task' : 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setEditedFields({}); // Discard all changes
    onOpenChange(false);
  };

  const isLoading = createTask.isPending || updateTask.isPending;

  // Parse due_date to Date object for Calendar component
  const dueDate = currentData.due_date ? new Date(currentData.due_date) : undefined;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the task details below'
              : 'Create a new task to organize your entries'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={currentData.title}
                onChange={(e) => updateField('title', e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description (optional)"
                value={currentData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Status (only show when editing) */}
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={currentData.status}
                  onValueChange={(v: any) => updateField('status', v)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a due date (optional)'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => updateField('due_date', date?.toISOString())}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => updateField('due_date', undefined)}
                      >
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Icon and Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  placeholder="📝"
                  value={currentData.icon || ''}
                  onChange={(e) => updateField('icon', e.target.value)}
                  disabled={isLoading}
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={currentData.color || '#3b82f6'}
                  onChange={(e) => updateField('color', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
