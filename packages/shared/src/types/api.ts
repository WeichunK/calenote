// Generic API Types

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface ValidationError {
  detail: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data?: any;
}

export type WebSocketMessageType =
  | 'ping'
  | 'pong'
  | 'entry:created'
  | 'entry:updated'
  | 'entry:deleted'
  | 'entry:completed'
  | 'task:updated'
  | 'task:deleted'
  | 'calendar:updated';
