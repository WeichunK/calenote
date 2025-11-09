// WebSocket message types matching backend
export type WebSocketMessageType =
  | 'connection:established'
  | 'entry:created'
  | 'entry:updated'
  | 'entry:deleted'
  | 'entry:completed'
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'task:completed'
  | 'task:archived'
  | 'user:typing'
  | 'user:cursor'
  | 'user:disconnected'
  | 'ping'
  | 'pong';

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  data: T;
  timestamp?: number;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface WebSocketConfig {
  url: string;
  token: string;
  calendarId: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  // Reconnection config
  maxReconnectAttempts?: number; // Default: Infinity
  reconnectInterval?: number;     // Default: 1000ms (exponential backoff)
  maxReconnectInterval?: number;  // Default: 30000ms
  heartbeatInterval?: number;     // Default: 30000ms (30s)
}

export interface WebSocketClient {
  connect(): void;
  disconnect(): void;
  send(message: WebSocketMessage): void;
  getStatus(): ConnectionStatus;
  isConnected(): boolean;
}
