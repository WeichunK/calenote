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

      // Invalidate entries list queries to refetch with new entry
      await queryClient.invalidateQueries({
        queryKey: ['entries', calendarId],
      });

      // If entry has a task_id, invalidate that task's queries
      if (message.data.task_id) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', calendarId, message.data.task_id],
        });
      }
    },

    'entry:updated': async (message: WebSocketMessage<Entry>) => {
      console.log('[WS Handler] Entry updated:', message.data);

      const entry = message.data;

      // Optimistically update cache (faster than invalidation)
      queryClient.setQueriesData(
        { queryKey: ['entries', calendarId] },
        (oldData: Entry[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(e => e.id === entry.id ? entry : e);
        }
      );

      // Also update individual entry query if it exists
      queryClient.setQueryData(['entries', entry.id], entry);

      // If entry moved between tasks, invalidate both tasks
      await queryClient.invalidateQueries({
        queryKey: ['tasks', calendarId],
      });
    },

    'entry:deleted': async (message: WebSocketMessage<{ id: string; calendar_id: string }>) => {
      console.log('[WS Handler] Entry deleted:', message.data);

      const { id } = message.data;

      // Remove from cache
      queryClient.setQueriesData(
        { queryKey: ['entries', calendarId] },
        (oldData: Entry[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(e => e.id !== id);
        }
      );

      // Remove individual entry query
      queryClient.removeQueries({ queryKey: ['entries', id] });

      // Invalidate tasks (in case entry was in a task)
      await queryClient.invalidateQueries({
        queryKey: ['tasks', calendarId],
      });
    },

    'entry:completed': async (message: WebSocketMessage<Entry>) => {
      console.log('[WS Handler] Entry completed:', message.data);

      const entry = message.data;

      // Update entry in cache
      queryClient.setQueriesData(
        { queryKey: ['entries', calendarId] },
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
          queryKey: ['tasks', calendarId, entry.task_id],
        });
      }
    },

    'task:created': async (message: WebSocketMessage<Task>) => {
      console.log('[WS Handler] Task created:', message.data);

      await queryClient.invalidateQueries({
        queryKey: ['tasks', calendarId],
      });
    },

    'task:updated': async (message: WebSocketMessage<Task>) => {
      console.log('[WS Handler] Task updated:', message.data);

      const task = message.data;

      // Update in cache
      queryClient.setQueriesData(
        { queryKey: ['tasks', calendarId] },
        (oldData: Task[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(t => t.id === task.id ? task : t);
        }
      );

      queryClient.setQueryData(['tasks', calendarId, task.id], task);
    },

    'task:deleted': async (message: WebSocketMessage<{ id: string; calendar_id: string }>) => {
      console.log('[WS Handler] Task deleted:', message.data);

      const { id } = message.data;

      queryClient.setQueriesData(
        { queryKey: ['tasks', calendarId] },
        (oldData: Task[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(t => t.id !== id);
        }
      );

      queryClient.removeQueries({ queryKey: ['tasks', calendarId, id] });
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
