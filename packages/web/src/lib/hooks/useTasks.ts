import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type GetTasksParams, type TasksResponse } from '@calenote/shared';
import type { Task, CreateTaskDTO, UpdateTaskDTO, ReorderEntriesDTO } from '@calenote/shared';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: GetTasksParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// Get tasks list with filters
export function useTasks(params?: GetTasksParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.getTasks(params),
    // Only enable query if calendar_id is provided (required by backend)
    enabled: !!params?.calendar_id,
  });
}

// Get single task with entries
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getTask(id),
    enabled: !!id,
  });
}

// Create task (with optimistic update)
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskDTO) => tasksApi.createTask(data),
    // Optimistic update: immediately add task to cache
    onMutate: async (newTask) => {
      console.log('[useTasks] onMutate - Creating task:', newTask);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous values
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });
      console.log('[useTasks] Previous cache entries:', previousTasks.length);

      // Create temporary task with optimistic ID
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        calendar_id: newTask.calendar_id,
        title: newTask.title,
        description: newTask.description,
        status: 'active',
        due_date: newTask.due_date,
        total_entries: 0,
        completed_entries: 0,
        completion_percentage: 0,
        color: newTask.color,
        icon: newTask.icon,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update all matching queries
      queryClient.setQueriesData<any>(
        { queryKey: taskKeys.lists() },
        (old: any) => {
          console.log('[useTasks] setQueriesData updater called, old:', old);

          // Handle paginated response: {tasks: Task[], total: number}
          if (old && typeof old === 'object' && 'tasks' in old && Array.isArray(old.tasks)) {
            console.log('[useTasks] Paginated response detected, prepending to tasks array');
            return {
              tasks: [optimisticTask, ...old.tasks],
              total: old.total + 1,
            };
          }

          // Handle array response: Task[]
          if (old && Array.isArray(old)) {
            console.log('[useTasks] Array response detected, prepending');
            return [optimisticTask, ...old];
          }

          // No existing data - check if backend uses pagination
          console.log('[useTasks] No existing data, creating new paginated response');
          return {
            tasks: [optimisticTask],
            total: 1,
          };
        }
      );

      // Verify the update
      const afterUpdate = queryClient.getQueriesData({ queryKey: taskKeys.lists() });
      console.log('[useTasks] After optimistic update, cache entries:', afterUpdate.length);
      afterUpdate.forEach(([key, data]) => {
        console.log('[useTasks] Cache key:', key, 'Data length:', (data as any)?.length);
      });

      return { previousTasks };
    },
    // On error: rollback optimistic update
    onError: (err, newTask, context) => {
      console.log('[useTasks] onError - Rolling back');
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // On success: invalidate and refetch
    onSuccess: (data) => {
      console.log('[useTasks] onSuccess - Invalidating queries, new task:', data);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDTO }) =>
      tasksApi.updateTask(id, data),
    onSuccess: (updatedTask) => {
      // Invalidate lists and update detail cache
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
    },
  });
}

// Delete task (with optimistic update)
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    // Optimistic update: immediately remove task from cache
    onMutate: async (deletedId) => {
      console.log('[useDeleteTask] onMutate - Deleting task:', deletedId);

      try {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

        // Snapshot previous values
        const previousLists = queryClient.getQueriesData({ queryKey: taskKeys.lists() });
        console.log('[useDeleteTask] Previous cache entries:', previousLists.length);

        // Optimistically remove task from all matching queries (handles paginated response)
        queryClient.setQueriesData(
          { queryKey: taskKeys.lists() },
          (old: any) => {
            console.log('[useDeleteTask] Updating cache, old data:', old);

            // Handle paginated response {tasks: Task[], total: number}
            if (old && typeof old === 'object' && 'tasks' in old) {
              console.log('[useDeleteTask] Paginated response detected');
              const updated = {
                ...old,
                tasks: old.tasks.filter((task: Task) => task.id !== deletedId),
                total: old.total - 1,
              };
              console.log('[useDeleteTask] Updated cache:', updated);
              return updated;
            }
            // Handle array response (legacy)
            if (Array.isArray(old)) {
              console.log('[useDeleteTask] Array response detected');
              return old.filter((task: Task) => task.id !== deletedId);
            }
            console.log('[useDeleteTask] No valid data format');
            return old;
          }
        );

        return { previousLists };
      } catch (error) {
        console.error('[useDeleteTask] onMutate error:', error);
        throw error;
      }
    },
    // On error: rollback optimistic update
    onError: (err, deletedId, context) => {
      console.error('[useDeleteTask] onError:', err);
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // On success: ensure task is removed from cache
    onSuccess: (data, deletedId) => {
      console.log('[useDeleteTask] onSuccess - Task deleted:', deletedId, 'Response data:', data);
      try {
        queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        console.log('[useDeleteTask] onSuccess completed successfully');
      } catch (error) {
        console.error('[useDeleteTask] onSuccess error:', error);
        throw error;
      }
    },
  });
}

// Reorder entries within a task
export function useReorderEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: ReorderEntriesDTO }) =>
      tasksApi.reorderEntries(taskId, data),
    onSuccess: (updatedTask) => {
      // Update task detail cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      // Invalidate task lists to reflect any changes
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Complete all entries in a task
export function useCompleteAllEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.completeAllEntries(taskId),
    onSuccess: (updatedTask) => {
      // Update task detail cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      // Invalidate task lists and entry lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}
