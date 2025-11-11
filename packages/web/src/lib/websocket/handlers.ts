import { QueryClient } from '@tanstack/react-query';
import { WebSocketMessage } from './types';
import type { Entry, Task } from '@calenote/shared';

export interface MessageHandlerContext {
  queryClient: QueryClient;
  calendarId: string;
}

export function createMessageHandlers(context: MessageHandlerContext) {
  const { queryClient, calendarId } = context;

  return {
    'entry:created': async (message: WebSocketMessage<Entry>) => {
      console.log('[WS Handler] Entry created:', message.data);

      const newEntry = message.data;

      // Immediately add new entry to ALL entry list caches
      queryClient.setQueriesData(
        { queryKey: ['entries', 'list'] },
        (oldData: Entry[] | undefined) => {
          console.log('[WS Handler] Adding entry to cache, oldData:', oldData);
          if (!oldData || !Array.isArray(oldData)) {
            console.log('[WS Handler] No existing data, creating new array with entry');
            return [newEntry];
          }
          console.log('[WS Handler] Prepending entry to existing array');
          return [newEntry, ...oldData];
        }
      );

      // If entry has a task_id, invalidate that task's queries
      if (newEntry.task_id) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', 'list'],
        });
      }
    },

    'entry:updated': async (message: WebSocketMessage<Entry>) => {
      console.log('[WS Handler] Entry updated:', message.data);

      const entry = message.data;

      // Optimistically update ALL entry list caches
      queryClient.setQueriesData(
        { queryKey: ['entries', 'list'] },
        (oldData: Entry[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(e => e.id === entry.id ? entry : e);
        }
      );

      // Also update individual entry query if it exists
      queryClient.setQueryData(['entries', 'detail', entry.id], entry);

      // If entry moved between tasks, invalidate tasks
      await queryClient.invalidateQueries({
        queryKey: ['tasks', 'list'],
      });
    },

    'entry:deleted': async (message: WebSocketMessage<{ id: string; calendar_id: string }>) => {
      console.log('[WS Handler] Entry deleted:', message.data);

      const { id } = message.data;

      // Remove from ALL entry list caches
      queryClient.setQueriesData(
        { queryKey: ['entries', 'list'] },
        (oldData: Entry[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(e => e.id !== id);
        }
      );

      // Remove individual entry query
      queryClient.removeQueries({ queryKey: ['entries', 'detail', id] });

      // Invalidate tasks (in case entry was in a task)
      await queryClient.invalidateQueries({
        queryKey: ['tasks', 'list'],
      });
    },

    'entry:completed': async (message: WebSocketMessage<Entry>) => {
      console.log('[WS Handler] Entry completed:', message.data);

      const entry = message.data;

      // Update entry in ALL list caches
      queryClient.setQueriesData(
        { queryKey: ['entries', 'list'] },
        (oldData: Entry[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(e =>
            e.id === entry.id
              ? { ...e, is_completed: entry.is_completed, completed_at: entry.completed_at }
              : e
          );
        }
      );

      // Update task progress if entry belongs to a task
      if (entry.task_id) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', 'list'],
        });
      }
    },

    'task:created': async (message: WebSocketMessage<Task>) => {
      console.log('[WS Handler] Task created:', message.data);

      // Invalidate ALL task list queries
      await queryClient.invalidateQueries({
        queryKey: ['tasks', 'list'],
      });
    },

    'task:updated': async (message: WebSocketMessage<Task>) => {
      console.log('[WS Handler] Task updated:', message.data);

      const task = message.data;

      // Update in ALL task list caches (handles paginated response)
      queryClient.setQueriesData(
        { queryKey: ['tasks', 'list'] },
        (oldData: any) => {
          // Handle paginated response {tasks: Task[], total: number}
          if (oldData && typeof oldData === 'object' && 'tasks' in oldData) {
            return {
              ...oldData,
              tasks: oldData.tasks.map((t: Task) => t.id === task.id ? task : t),
            };
          }
          // Handle array response
          if (Array.isArray(oldData)) {
            return oldData.map((t: Task) => t.id === task.id ? task : t);
          }
          return oldData;
        }
      );

      // Update detail cache
      queryClient.setQueryData(['tasks', 'detail', task.id], task);
    },

    'task:deleted': async (message: WebSocketMessage<{ id: string; calendar_id: string }>) => {
      console.log('[WS Handler] Task deleted:', message.data);

      const { id } = message.data;

      // Remove from ALL task list caches (handles paginated response)
      queryClient.setQueriesData(
        { queryKey: ['tasks', 'list'] },
        (oldData: any) => {
          // Handle paginated response {tasks: Task[], total: number}
          if (oldData && typeof oldData === 'object' && 'tasks' in oldData) {
            return {
              ...oldData,
              tasks: oldData.tasks.filter((t: Task) => t.id !== id),
              total: oldData.total - 1,
            };
          }
          // Handle array response
          if (Array.isArray(oldData)) {
            return oldData.filter((t: Task) => t.id !== id);
          }
          return oldData;
        }
      );

      // Remove detail cache
      queryClient.removeQueries({ queryKey: ['tasks', 'detail', id] });
    },

    'connection:established': (message: WebSocketMessage) => {
      console.log('[WS Handler] Connection established:', message.data);
    },

    'user:disconnected': (message: WebSocketMessage) => {
      console.log('[WS Handler] User disconnected:', message.data);
    },
  };
}

export function handleWebSocketMessage(
  message: WebSocketMessage,
  context: MessageHandlerContext
): void {
  const handlers = createMessageHandlers(context);
  const handler = handlers[message.type as keyof typeof handlers];

  if (handler) {
    handler(message);
  } else {
    console.warn('[WS Handler] Unknown message type:', message.type);
  }
}
