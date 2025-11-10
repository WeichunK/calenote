import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entriesApi, type GetEntriesParams } from '@calenote/shared';
import type { Entry, CreateEntryDTO, UpdateEntryDTO } from '@calenote/shared';

// Query keys
export const entryKeys = {
  all: ['entries'] as const,
  lists: () => [...entryKeys.all, 'list'] as const,
  list: (params?: GetEntriesParams) => [...entryKeys.lists(), params] as const,
  details: () => [...entryKeys.all, 'detail'] as const,
  detail: (id: string) => [...entryKeys.details(), id] as const,
};

// Get entries list with filters
export function useEntries(params?: GetEntriesParams) {
  return useQuery({
    queryKey: entryKeys.list(params),
    queryFn: () => entriesApi.getEntries(params),
    // Only enable query if calendar_id is provided (required by backend)
    enabled: !!params?.calendar_id,
  });
}

// Get single entry
export function useEntry(id: string) {
  return useQuery({
    queryKey: entryKeys.detail(id),
    queryFn: () => entriesApi.getEntry(id),
    enabled: !!id,
  });
}

// Create entry (with optimistic update)
export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEntryDTO) => entriesApi.createEntry(data),
    // Optimistic update: immediately add entry to cache
    onMutate: async (newEntry) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: entryKeys.lists() });

      // Snapshot previous values
      const previousEntries = queryClient.getQueriesData({ queryKey: entryKeys.lists() });

      // Optimistically update all matching queries
      queryClient.setQueriesData<Entry[]>(
        { queryKey: entryKeys.lists() },
        (old) => {
          if (!old) return old;
          // Create temporary entry with optimistic ID
          const optimisticEntry: Entry = {
            id: `temp-${Date.now()}`,
            calendar_id: newEntry.calendar_id,
            title: newEntry.title,
            content: newEntry.content || '',
            entry_type: newEntry.entry_type,
            timestamp: newEntry.timestamp,
            end_timestamp: newEntry.end_timestamp,
            is_all_day: newEntry.is_all_day || false,
            is_completed: false,
            completed_at: undefined,
            completed_by: undefined,
            priority: newEntry.priority || 0,
            tags: newEntry.tags || [],
            color: newEntry.color,
            reminder_time: newEntry.reminder_time,
            recurrence_rule: newEntry.recurrence_rule,
            task_id: newEntry.task_id,
            created_by: 'current-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_modified_by: undefined,
          };
          return [optimisticEntry, ...old];
        }
      );

      return { previousEntries };
    },
    // On error: rollback optimistic update
    onError: (err, newEntry, context) => {
      if (context?.previousEntries) {
        context.previousEntries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // On success: replace optimistic entry with real one
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

// Update entry
export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntryDTO }) =>
      entriesApi.updateEntry(id, data),
    onSuccess: (updatedEntry) => {
      // Invalidate lists and update detail cache
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
      queryClient.setQueryData(entryKeys.detail(updatedEntry.id), updatedEntry);
    },
  });
}

// Delete entry (with optimistic update)
export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => entriesApi.deleteEntry(id),
    // Optimistic update: immediately remove entry from cache
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: entryKeys.lists() });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: entryKeys.lists() });

      // Optimistically remove entry from all matching queries
      queryClient.setQueriesData<Entry[]>(
        { queryKey: entryKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.filter((entry) => entry.id !== deletedId);
        }
      );

      return { previousLists };
    },
    // On error: rollback optimistic update
    onError: (err, deletedId, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // On success: ensure entry is removed from cache
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: entryKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

// Toggle entry completion (with optimistic update)
export function useToggleEntryComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      entriesApi.toggleComplete(id, isCompleted),
    // Optimistic update: immediately toggle completion status
    onMutate: async ({ id, isCompleted }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: entryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: entryKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: entryKeys.lists() });
      const previousDetail = queryClient.getQueryData(entryKeys.detail(id));

      // Optimistically update all matching queries
      queryClient.setQueriesData<Entry[]>(
        { queryKey: entryKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  is_completed: isCompleted,
                  completed_at: isCompleted ? new Date().toISOString() : undefined,
                  completed_by: isCompleted ? 'current-user' : undefined,
                }
              : entry
          );
        }
      );

      // Update detail cache if it exists
      queryClient.setQueryData<Entry>(entryKeys.detail(id), (old) => {
        if (!old) return old;
        return {
          ...old,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : undefined,
          completed_by: isCompleted ? 'current-user' : undefined,
        };
      });

      return { previousLists, previousDetail };
    },
    // On error: rollback optimistic update
    onError: (err, { id }, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(entryKeys.detail(id), context.previousDetail);
      }
    },
    // On success: sync with server data
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData(entryKeys.detail(updatedEntry.id), updatedEntry);
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

// Add entry to task
export function useAddEntryToTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, taskId }: { id: string; taskId: string }) =>
      entriesApi.addToTask(id, taskId),
    onSuccess: (updatedEntry) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
      queryClient.setQueryData(entryKeys.detail(updatedEntry.id), updatedEntry);
    },
  });
}

// Remove entry from task
export function useRemoveEntryFromTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => entriesApi.removeFromTask(id),
    onSuccess: (updatedEntry) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
      queryClient.setQueryData(entryKeys.detail(updatedEntry.id), updatedEntry);
    },
  });
}
