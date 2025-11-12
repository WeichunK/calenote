'use client';

import { useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { Entry } from '@calenote/shared';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export type EntryFormValues = {
  title: string;
  content?: string;
  entry_type: 'note' | 'task' | 'event'; // Must match backend validation
  timestamp?: string;
  end_timestamp?: string;
  is_all_day?: boolean;
  priority?: number;
  tags?: string;
  color?: string;
};

interface EntryFormFieldsProps {
  form: UseFormReturn<EntryFormValues>;
  error?: string | null;
}

export function EntryFormFields({ form, error }: EntryFormFieldsProps) {
  // Watch timestamp changes to auto-update end_timestamp
  const timestamp = form.watch('timestamp');
  const endTimestamp = form.watch('end_timestamp');
  const prevTimestampRef = useRef<string | undefined>(timestamp);

  useEffect(() => {
    // Auto-update end_timestamp when timestamp changes
    // Strategy: Check if end_timestamp was "auto-synced" with PREVIOUS start time
    // If yes, update it to match NEW start time. If user manually changed it, don't update.

    if (!timestamp) return;

    try {
      const startDate = new Date(timestamp);
      if (isNaN(startDate.getTime())) return;

      // Calculate what the auto-filled end time should be
      const autoEndDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

      // Check if end_timestamp should be auto-updated
      let shouldUpdate = false;

      if (!endTimestamp) {
        // Case 1: End time is empty - always auto-fill
        shouldUpdate = true;
      } else if (prevTimestampRef.current) {
        // Case 2: Check if end time was 1 hour after PREVIOUS start time
        const prevStartDate = new Date(prevTimestampRef.current);
        const currentEndDate = new Date(endTimestamp);

        if (!isNaN(prevStartDate.getTime()) && !isNaN(currentEndDate.getTime())) {
          // Calculate time difference between current end and PREVIOUS start
          const timeDiff = currentEndDate.getTime() - prevStartDate.getTime();
          const oneHourInMs = 60 * 60 * 1000;

          // If end was 1 hour after the OLD start, update it to match NEW start
          if (Math.abs(timeDiff - oneHourInMs) < 60 * 1000) {
            shouldUpdate = true;
          }
          // Otherwise, user has manually modified it - don't update
        }
      }

      if (shouldUpdate) {
        // Format to datetime-local format (YYYY-MM-DDTHH:mm)
        const year = autoEndDate.getFullYear();
        const month = String(autoEndDate.getMonth() + 1).padStart(2, '0');
        const day = String(autoEndDate.getDate()).padStart(2, '0');
        const hours = String(autoEndDate.getHours()).padStart(2, '0');
        const minutes = String(autoEndDate.getMinutes()).padStart(2, '0');

        const formattedEndTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        form.setValue('end_timestamp', formattedEndTime, { shouldValidate: false });
      }

      // Update ref for next comparison
      prevTimestampRef.current = timestamp;
    } catch (error) {
      // Silently fail if date parsing fails
      console.error('Failed to auto-update end_timestamp:', error);
    }
  }, [timestamp, endTimestamp, form]);

  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title *</FormLabel>
            <FormControl>
              <Input placeholder="Entry title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Entry Type */}
      <FormField
        control={form.control}
        name="entry_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select entry type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="note">📝 Note</SelectItem>
                <SelectItem value="task">✅ Task</SelectItem>
                <SelectItem value="event">📅 Event</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Content */}
      <FormField
        control={form.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter details about this entry..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* All Day Toggle */}
      <FormField
        control={form.control}
        name="is_all_day"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>All-day event</FormLabel>
              <FormDescription>
                This entry lasts the entire day
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Timestamp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="timestamp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_timestamp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Priority */}
      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Priority</FormLabel>
            <Select
              onValueChange={(value: string) => field.onChange(parseInt(value))}
              value={String(field.value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="1">🟢 Low</SelectItem>
                <SelectItem value="2">🟡 Medium</SelectItem>
                <SelectItem value="3">🔴 High</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tags */}
      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <Input placeholder="work, personal, urgent (comma-separated)" {...field} />
            </FormControl>
            <FormDescription>
              Enter tags separated by commas
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Color */}
      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Color</FormLabel>
            <FormControl>
              <div className="flex gap-2">
                <Input type="color" className="w-20 h-10" {...field} />
                <Input
                  placeholder="#3b82f6"
                  value={field.value}
                  onChange={field.onChange}
                  className="flex-1"
                />
              </div>
            </FormControl>
            <FormDescription>
              Choose a color to categorize this entry
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
