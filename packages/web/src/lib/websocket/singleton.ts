import { CalenoteWebSocketClient } from './client';
import type { WebSocketConfig } from './types';

/**
 * Singleton WebSocket client manager
 * Ensures only one WebSocket connection exists even across HMR/re-renders
 */
class WebSocketSingleton {
  private static instance: CalenoteWebSocketClient | null = null;
  private static currentCalendarId: string | null = null;

  static getClient(config: WebSocketConfig): CalenoteWebSocketClient {
    // If calendar changed, disconnect old client
    if (this.currentCalendarId && this.currentCalendarId !== config.calendarId) {
      console.log('[WebSocketSingleton] Calendar changed, disconnecting old client');
      this.disconnect();
    }

    // If no client or calendar changed, create new one
    if (!this.instance || this.currentCalendarId !== config.calendarId) {
      console.log('[WebSocketSingleton] Creating new WebSocket client for calendar:', config.calendarId);
      this.instance = new CalenoteWebSocketClient(config);
      this.currentCalendarId = config.calendarId;
    } else {
      console.log('[WebSocketSingleton] Reusing existing WebSocket client');
    }

    return this.instance;
  }

  static disconnect() {
    if (this.instance) {
      console.log('[WebSocketSingleton] Disconnecting client');
      this.instance.disconnect();
      this.instance = null;
      this.currentCalendarId = null;
    }
  }

  static getCurrentCalendarId(): string | null {
    return this.currentCalendarId;
  }

  static isConnected(): boolean {
    return this.instance?.isConnected() ?? false;
  }
}

export default WebSocketSingleton;
