'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import type { Entry, CreateEntryDTO } from '@calenote/shared';
import { useCreateEntry, useUpdateEntry, useDeleteEntry } from '@/lib/hooks/useEntries';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { EntryFormFields, type EntryFormValues } from './EntryFormFields';

const entryFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  content: z.string().optional(),
  entry_type: z.enum(['note', 'task', 'event']), // Must match backend validation
  timestamp: z.string().optional(),
  end_timestamp: z.string().optional(),
  is_all_day: z.boolean().optional(),
  priority: z.number().int().min(0).max(3).optional(),
  tags: z.string().optional(), // Comma-separated tags
  color: z.string().optional(),
});

interface EntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Entry; // If provided, edit mode
  defaultDate?: Date; // If provided, pre-fill timestamp for new entry
  defaultTaskId?: string; // If provided, pre-fill task_id for new entry
  calendarId: string; // Required for creating entries
}

export function EntryDialog({
  open,
  onOpenChange,
  entry,
  defaultDate,
  defaultTaskId,
  calendarId,
}: EntryDialogProps) {
  const isEditMode = !!entry;
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      title: '',
      content: '',
      entry_type: 'event',
      timestamp: defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : '',
      end_timestamp: '',
      is_all_day: false,
      priority: 0,
      tags: '',
      color: '',
    },
  });

  // Reset form when dialog opens/closes or entry changes
  useEffect(() => {
    if (!open) {
      form.reset();
      return;
    }

    if (entry) {
      form.reset({
        title: entry.title,
        content: entry.content || '',
        entry_type: entry.entry_type,
        timestamp: entry.timestamp ? entry.timestamp.substring(0, 16) : '',
        end_timestamp: entry.end_timestamp ? entry.end_timestamp.substring(0, 16) : '',
        is_all_day: entry.is_all_day || false,
        priority: entry.priority || 0,
        tags: entry.tags?.join(', ') || '',
        color: entry.color || '',
      });
    } else {
      form.reset({
        title: '',
        content: '',
        entry_type: 'event',
        timestamp: defaultDate ? format(defaultDate, "yyyy-MM-dd'T'HH:mm") : '',
        end_timestamp: '',
        is_all_day: false,
        priority: 0,
        tags: '',
        color: '',
      });
    }
  }, [open, entry, defaultDate, form]);

  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: EntryFormValues) => {
    setError(null);
    try {
      const tags = values.tags
        ? values.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : undefined;

      // Helper function to convert empty strings to undefined
      const sanitizeValue = (value: any) => {
        if (typeof value === 'string' && value.trim() === '') {
          return undefined;
        }
        return value;
      };

      if (isEditMode) {
        // Update payload: exclude calendar_id (immutable) and is_completed (use separate endpoint)
        // Only include fields that have actual values (not empty strings)
        const updateData: any = {
          title: values.title,
        };

        // Only add optional fields if they have values
        if (sanitizeValue(values.content)) updateData.content = values.content;
        if (values.entry_type) updateData.entry_type = values.entry_type;
        if (sanitizeValue(values.timestamp)) updateData.timestamp = values.timestamp;
        if (sanitizeValue(values.end_timestamp)) updateData.end_timestamp = values.end_timestamp;
        if (values.is_all_day !== undefined) updateData.is_all_day = values.is_all_day;
        if (values.priority !== undefined && values.priority !== null) {
          updateData.priority = values.priority as 0 | 1 | 2 | 3;
        }
        if (tags && tags.length > 0) updateData.tags = tags;
        if (sanitizeValue(values.color)) updateData.color = values.color;

        await updateEntry.mutateAsync({ id: entry.id, data: updateData });
      } else {
        // Create payload: includes calendar_id and optional task_id
        const createData: CreateEntryDTO = {
          calendar_id: calendarId,
          title: values.title,
          content: sanitizeValue(values.content),
          entry_type: values.entry_type,
          timestamp: sanitizeValue(values.timestamp),
          end_timestamp: sanitizeValue(values.end_timestamp),
          is_all_day: values.is_all_day,
          priority: values.priority as 0 | 1 | 2 | 3 | undefined,
          tags: tags && tags.length > 0 ? tags : undefined,
          color: sanitizeValue(values.color),
          task_id: defaultTaskId || undefined,
        };
        await createEntry.mutateAsync(createData);
      }

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!entry) return;

    if (confirm('Are you sure you want to delete this entry?')) {
      setError(null);
      try {
        await deleteEntry.mutateAsync(entry.id);
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete entry. Please try again.');
      }
    }
  };

  const isLoading = createEntry.isPending || updateEntry.isPending || deleteEntry.isPending;
  const isMobile = useIsMobile();

  // Form content
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <EntryFormFields form={form} error={error} />

        {/* Footer buttons are rendered outside form in Dialog/Sheet */}
      </form>
    </Form>
  );

  // Action buttons
  const actionButtons = (
    <>
      {isEditMode && (
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Delete
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="w-full sm:w-auto"
      >
        Cancel
      </Button>
      <Button
        onClick={form.handleSubmit(onSubmit)}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Entry'}
      </Button>
    </>
  );

  // Mobile: Full-screen Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* @ts-ignore - SheetContent type issue with children prop */}
        <SheetContent side="bottom" className="h-[95vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditMode ? 'Edit Entry' : 'Create Entry'}</SheetTitle>
            <SheetDescription>
              {isEditMode
                ? 'Make changes to your entry here.'
                : 'Create a new entry for your calendar.'}
            </SheetDescription>
          </SheetHeader>

          {formContent}

          <SheetFooter className="gap-2 mt-6">
            {actionButtons}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Entry' : 'Create Entry'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Make changes to your entry here.'
              : 'Create a new entry for your calendar.'}
          </DialogDescription>
        </DialogHeader>

        {formContent}

        <DialogFooter className="gap-2">
          {actionButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
