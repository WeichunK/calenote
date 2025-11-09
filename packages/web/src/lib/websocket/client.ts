import { WebSocketConfig, WebSocketMessage, ConnectionStatus, WebSocketClient } from './types';

export class CalenoteWebSocketClient implements WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private status: ConnectionStatus = 'disconnected';
  private isIntentionalDisconnect = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      maxReconnectAttempts: Infinity,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      heartbeatInterval: 30000,
      onMessage: () => {},
      onConnect: () => {},
      onDisconnect: () => {},
      onError: () => {},
      ...config,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected');
      return;
    }

    this.isIntentionalDisconnect = false;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${this.config.url}/ws/calendar/${this.config.calendarId}?token=${this.config.token}`;

    console.log(`[WS] Connecting to ${wsUrl.replace(this.config.token, 'TOKEN')}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('[WS] Connection error:', error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    console.log('[WS] Intentional disconnect');
    this.isIntentionalDisconnect = true;
    this.clearTimers();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WS] Cannot send message - not connected', message);
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  private handleOpen(): void {
    console.log('[WS] Connected successfully');
    this.reconnectAttempts = 0;
    this.setStatus('connected');
    this.config.onConnect?.();
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Handle pong response
      if (message.type === 'pong') {
        this.resetHeartbeat();
        return;
      }

      // Pass message to handler
      this.config.onMessage?.(message);
    } catch (error) {
      console.error('[WS] Failed to parse message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`[WS] Connection closed: code=${event.code}, reason=${event.reason}`);
    this.clearTimers();
    this.setStatus('disconnected');
    this.config.onDisconnect?.();

    // Check for authentication failure
    if (event.code === 1008) {
      console.error('[WS] Authentication failed');
      window.dispatchEvent(new CustomEvent('ws:auth-failed'));
      return;
    }

    // Auto-reconnect unless intentional disconnect
    if (!this.isIntentionalDisconnect) {
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('[WS] WebSocket error:', event);
    this.setStatus('error');
    this.config.onError?.(event);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectInterval
    );

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.resetHeartbeat();
  }

  private resetHeartbeat(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    this.heartbeatTimeout = setTimeout(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('[WS] Sending ping');
        this.send({ type: 'ping', data: {} });

        // If no pong received in 5s, assume connection is dead
        setTimeout(() => {
          if (this.status === 'connected') {
            console.warn('[WS] No pong received, reconnecting');
            this.ws?.close();
          }
        }, 5000);
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      console.log(`[WS] Status: ${this.status} → ${status}`);
      this.status = status;
    }
  }
}
