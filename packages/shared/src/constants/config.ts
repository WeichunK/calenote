// Application constants

// API Configuration
// CRITICAL: Use getter functions to ensure runtime detection works correctly
// Static values would be evaluated during SSR and carry over to client incorrectly

// Helper function to detect Zeabur production environment
function isZeaburProdEnv(): boolean {
  if (typeof window === 'undefined') return false; // SSR
  return window.location.hostname.includes('zeabur.app');
}

// Helper function to detect local development
function isLocalDev(): boolean {
  if (typeof window === 'undefined') return false; // SSR
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function getBaseUrl(): string {
  // During SSR, use production URL
  if (typeof window === 'undefined') {
    return 'https://calenote-backend.zeabur.app/api/v1';
  }

  // Client-side: check hostname
  if (isLocalDev()) {
    return 'http://localhost:8000/api/v1';
  }

  // Production (Zeabur or other)
  return 'https://calenote-backend.zeabur.app/api/v1';
}

function getWsUrl(): string {
  // During SSR, use production URL
  if (typeof window === 'undefined') {
    return 'wss://calenote-backend.zeabur.app';
  }

  // Client-side: check hostname
  if (isLocalDev()) {
    return 'ws://localhost:8000';
  }

  // Production (Zeabur or other)
  return 'wss://calenote-backend.zeabur.app';
}

// Export as an object with getters to ensure fresh evaluation each time
export const API_CONFIG = {
  get BASE_URL() {
    return getBaseUrl();
  },
  get WS_URL() {
    return getWsUrl();
  },
  TIMEOUT: 10000, // 10 seconds
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Entry defaults
export const ENTRY_DEFAULTS = {
  TYPE: 'note' as const,
  PRIORITY: 0 as const,
};

// Priority colors
export const PRIORITY_COLORS = {
  0: '#9CA3AF', // gray-400
  1: '#3B82F6', // blue-500
  2: '#F59E0B', // amber-500
  3: '#EF4444', // red-500
};

// Entry type colors
export const ENTRY_TYPE_COLORS = {
  event: '#8B5CF6', // violet-500
  note: '#6B7280', // gray-500
  reminder: '#F97316', // orange-500
};

// Calendar colors (preset)
export const CALENDAR_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

// WebSocket
export const WS_CONFIG = {
  RECONNECT_DELAY: 3000, // 3 seconds
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
};

// Date/Time formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  INPUT: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
};

// Validation limits
export const LIMITS = {
  ENTRY_TITLE: 500,
  ENTRY_CONTENT: 10000,
  TASK_TITLE: 200,
  TASK_DESCRIPTION: 2000,
  CALENDAR_NAME: 100,
  USERNAME: 50,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 128,
};
