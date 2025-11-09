import { create } from 'zustand';
import { ConnectionStatus } from '../websocket/types';

interface WebSocketStore {
  status: ConnectionStatus;
  reconnectAttempts: number;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;

  // Actions
  setStatus: (status: ConnectionStatus) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  setLastConnectedAt: (date: Date) => void;
  setLastDisconnectedAt: (date: Date) => void;

  // Computed
  isConnected: () => boolean;
  isConnecting: () => boolean;
  isDisconnected: () => boolean;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  status: 'disconnected',
  reconnectAttempts: 0,
  lastConnectedAt: null,
  lastDisconnectedAt: null,

  setStatus: (status) => set({ status }),
  incrementReconnectAttempts: () => set((state) => ({
    reconnectAttempts: state.reconnectAttempts + 1
  })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
  setLastConnectedAt: (date) => set({ lastConnectedAt: date }),
  setLastDisconnectedAt: (date) => set({ lastDisconnectedAt: date }),

  isConnected: () => get().status === 'connected',
  isConnecting: () => ['connecting', 'reconnecting'].includes(get().status),
  isDisconnected: () => get().status === 'disconnected',
}));
