import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type GetTasksParams } from '@calenote/shared';
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous values
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically update all matching queries
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          // Create temporary task with optimistic ID
          const optimisticTask: Task = {
            id: `temp-${Date.now()}`,
            calendar_id: newTask.calendar_id,
            title: newTask.title,
            description: newTask.description || '',
            status: 'active',
            due_date: newTask.due_date,
            total_entries: 0,
            completed_entries: 0,
            created_by: 'current-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_modified_by: undefined,
          };
          return [optimisticTask, ...old];
        }
      );

      return { previousTasks };
    },
    // On error: rollback optimistic update
    onError: (err, newTask, context) => {
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // On success: replace optimistic task with real one
    onSuccess: () => {
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically remove task from all matching queries
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.filter((task) => task.id !== deletedId);
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
    // On success: ensure task is removed from cache
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
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
