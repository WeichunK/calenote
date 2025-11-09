'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalenoteWebSocketClient } from './client';
import { useWebSocketStore } from '../stores/websocketStore';
import { handleWebSocketMessage } from './handlers';
import { useAuthStore } from '../stores/authStore';

interface UseWebSocketOptions {
  calendarId: string;
  enabled?: boolean;
}

export function useWebSocket({ calendarId, enabled = true }: UseWebSocketOptions) {
  const queryClient = useQueryClient();
  const clientRef = useRef<CalenoteWebSocketClient | null>(null);
  const store = useWebSocketStore();
  const tokens = useAuthStore((state) => state.tokens);

  useEffect(() => {
    // Don't connect if disabled or no calendar
    if (!enabled || !calendarId) {
      return;
    }

    const token = tokens?.access;
    if (!token) {
      console.warn('[useWebSocket] No access token available');
      return;
    }

    // Get WebSocket URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'localhost:8000';
    const wsUrl = apiUrl.replace(/^https?:\/\//, ''); // Remove protocol

    console.log('[useWebSocket] Initializing for calendar:', calendarId);

    // Create WebSocket client
    clientRef.current = new CalenoteWebSocketClient({
      url: wsUrl,
      token,
      calendarId,

      onConnect: () => {
        store.setStatus('connected');
        store.resetReconnectAttempts();
        store.setLastConnectedAt(new Date());

        // If reconnected (not first connection), invalidate cache
        if (store.lastDisconnectedAt) {
          console.log('[useWebSocket] Reconnected - invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['entries', calendarId] });
          queryClient.invalidateQueries({ queryKey: ['tasks', calendarId] });
        }
      },

      onDisconnect: () => {
        store.setStatus('disconnected');
        store.setLastDisconnectedAt(new Date());
      },

      onError: (error) => {
        console.error('[useWebSocket] Error:', error);
        store.setStatus('error');
      },

      onMessage: (message) => {
        handleWebSocketMessage(message, { queryClient, calendarId });
      },
    });

    // Connect
    clientRef.current.connect();

    // Cleanup on unmount
    return () => {
      console.log('[useWebSocket] Cleaning up');
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, enabled]); // Removed 'tokens' - only reconnect when calendar/enabled changes

  return {
    status: store.status,
    isConnected: store.isConnected(),
    isConnecting: store.isConnecting(),
    reconnectAttempts: store.reconnectAttempts,
  };
}
