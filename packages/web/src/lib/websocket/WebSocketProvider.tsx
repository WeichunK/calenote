'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalenoteWebSocketClient } from './client';
import { useWebSocketStore } from '../stores/websocketStore';
import { handleWebSocketMessage } from './handlers';
import { useAuthStore } from '../stores/authStore';
import { useCalendarStore } from '../stores/calendarStore';
import WebSocketSingleton from './singleton';

// Context to share WebSocket client across app
const WebSocketContext = createContext<CalenoteWebSocketClient | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const clientRef = useRef<CalenoteWebSocketClient | null>(null);
  const store = useWebSocketStore();
  const tokens = useAuthStore((state) => state.tokens);
  const currentCalendarId = useCalendarStore((state) => state.currentCalendarId);

  useEffect(() => {
    // Don't connect if no calendar or no token
    if (!currentCalendarId || !tokens?.access) {
      console.log('[WebSocketProvider] Not connecting - missing calendar or token');
      return;
    }

    // Get WebSocket URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'localhost:8000';
    const wsUrl = apiUrl.replace(/^https?:\/\//, ''); // Remove protocol

    console.log('[WebSocketProvider] Initializing connection for calendar:', currentCalendarId);

    // Use singleton to get/create WebSocket client (survives HMR/re-renders)
    const client = WebSocketSingleton.getClient({
      url: wsUrl,
      token: tokens.access,
      calendarId: currentCalendarId,

      onConnect: () => {
        console.log('[WebSocketProvider] Connected');
        store.setStatus('connected');
        store.resetReconnectAttempts();
        store.setLastConnectedAt(new Date());

        // If reconnected (not first connection), invalidate cache
        if (store.lastDisconnectedAt) {
          console.log('[WebSocketProvider] Reconnected - invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['entries', currentCalendarId] });
          queryClient.invalidateQueries({ queryKey: ['tasks', currentCalendarId] });
        }
      },

      onDisconnect: () => {
        console.log('[WebSocketProvider] Disconnected');
        store.setStatus('disconnected');
        store.setLastDisconnectedAt(new Date());
      },

      onError: (error) => {
        console.error('[WebSocketProvider] Error:', error);
        store.setStatus('error');
      },

      onMessage: (message) => {
        handleWebSocketMessage(message, { queryClient, calendarId: currentCalendarId });
      },
    });

    clientRef.current = client;

    // Connect if not already connected
    if (!client.isConnected()) {
      console.log('[WebSocketProvider] Connecting WebSocket');
      client.connect();
    } else {
      console.log('[WebSocketProvider] WebSocket already connected');
    }

    // Cleanup: Don't disconnect on unmount to survive HMR
    // Only disconnect when calendar changes (handled by singleton)
    return () => {
      console.log('[WebSocketProvider] Component unmounting (connection preserved)');
    };
  }, [currentCalendarId]); // Only reconnect when calendar changes

  return (
    <WebSocketContext.Provider value={clientRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook to access WebSocket client (for sending messages)
export function useWebSocketClient() {
  return useContext(WebSocketContext);
}
