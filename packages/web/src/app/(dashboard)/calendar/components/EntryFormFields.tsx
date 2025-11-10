'use client';

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
