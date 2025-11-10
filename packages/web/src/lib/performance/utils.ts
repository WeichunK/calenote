/**
 * Performance Utilities
 *
 * Helpers for optimizing app performance including code splitting,
 * lazy loading, and performance monitoring.
 */

import { ComponentType, lazy as reactLazy, LazyExoticComponent } from 'react';

// ==================== CODE SPLITTING ====================

/**
 * Enhanced lazy loading with error handling and retry logic
 */
export const lazyWithRetry = <T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3,
  interval: number = 1000
): LazyExoticComponent<T> => {
  return reactLazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = async (attemptsLeft: number) => {
        try {
          const component = await componentImport();
          resolve(component);
        } catch (error) {
          if (attemptsLeft === 0) {
            reject(error);
            return;
          }

          console.warn(
            `Failed to load component, retrying... (${retries - attemptsLeft + 1}/${retries})`,
            error
          );

          setTimeout(() => {
            attemptImport(attemptsLeft - 1);
          }, interval);
        }
      };

      attemptImport(retries);
    });
  });
};

/**
 * Preload a component for faster loading
 */
export const preloadComponent = (
  componentImport: () => Promise<{ default: ComponentType<any> }>
): void => {
  componentImport();
};

/**
 * Prefetch multiple components in parallel
 */
export const prefetchComponents = (
  componentImports: Array<() => Promise<{ default: ComponentType<any> }>>
): void => {
  componentImports.forEach((importFn) => preloadComponent(importFn));
};

// ==================== IMAGE OPTIMIZATION ====================

/**
 * Generate responsive image sizes
 */
export const generateSrcSet = (
  baseUrl: string,
  sizes: number[]
): string => {
  return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(', ');
};

/**
 * Check if WebP is supported
 */
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

/**
 * Get optimized image format
 */
export const getImageFormat = (): 'webp' | 'jpg' => {
  return supportsWebP() ? 'webp' : 'jpg';
};

// ==================== PERFORMANCE MONITORING ====================

/**
 * Measure function execution time
 */
export const measurePerformance = async <T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

/**
 * Performance mark helper
 */
export const mark = (name: string): void => {
  if (typeof performance !== 'undefined') {
    performance.mark(name);
  }
};

/**
 * Performance measure helper
 */
export const measure = (
  name: string,
  startMark: string,
  endMark: string
): PerformanceMeasure | null => {
  if (typeof performance !== 'undefined') {
    try {
      return performance.measure(name, startMark, endMark);
    } catch (error) {
      console.warn(`Failed to measure ${name}`, error);
      return null;
    }
  }
  return null;
};

/**
 * Get performance entries
 */
export const getPerformanceEntries = (
  type: 'navigation' | 'resource' | 'measure' | 'mark' = 'measure'
): PerformanceEntry[] => {
  if (typeof performance !== 'undefined') {
    return performance.getEntriesByType(type);
  }
  return [];
};

/**
 * Clear performance marks
 */
export const clearMarks = (name?: string): void => {
  if (typeof performance !== 'undefined') {
    if (name) {
      performance.clearMarks(name);
    } else {
      performance.clearMarks();
    }
  }
};

// ==================== RESOURCE OPTIMIZATION ====================

/**
 * Debounce function for performance
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Memoize function results
 */
export const memoize = <T extends (...args: any[]) => any>(
  fn: T
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// ==================== INTERSECTION OBSERVER ====================

/**
 * Create an intersection observer for lazy loading
 */
export const createLazyLoadObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, options);
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// ==================== BUNDLE SIZE OPTIMIZATION ====================

/**
 * Check if code is running on client
 */
export const isClient = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Check if code is running on server
 */
export const isServer = (): boolean => {
  return !isClient();
};

/**
 * Dynamic import with loading state
 */
export const dynamicImport = async <T>(
  importFn: () => Promise<T>,
  onLoading?: () => void,
  onLoaded?: () => void,
  onError?: (error: Error) => void
): Promise<T | null> => {
  try {
    if (onLoading) onLoading();
    const module = await importFn();
    if (onLoaded) onLoaded();
    return module;
  } catch (error) {
    if (onError) onError(error as Error);
    return null;
  }
};

// ==================== WEB VITALS ====================

/**
 * Report Web Vitals (Core Web Vitals)
 */
export const reportWebVitals = (
  onPerfEntry?: (metric: {
    id: string;
    name: string;
    value: number;
    label: string;
  }) => void
): void => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
};

// ==================== MEMORY OPTIMIZATION ====================

/**
 * Clear large objects from memory
 */
export const clearFromMemory = (obj: any): void => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      delete obj[key];
    });
  }
};

/**
 * Get memory usage (if available)
 */
export const getMemoryUsage = (): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null => {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// ==================== REQUEST OPTIMIZATION ====================

/**
 * Batch multiple requests into a single call
 */
export const batchRequests = async <T>(
  requests: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<T[]> => {
  const results: T[] = [];

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((req) => req()));
    results.push(...batchResults);
  }

  return results;
};

/**
 * Request with timeout
 */
export const requestWithTimeout = async <T>(
  request: () => Promise<T>,
  timeout: number = 5000
): Promise<T> => {
  return Promise.race([
    request(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

// ==================== CACHE HELPERS ====================

/**
 * Simple in-memory cache with expiration
 */
export class SimpleCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();

  set(key: string, value: T, ttl: number = 60000): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

  if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ==================== EXPORTS ====================

export const performanceUtils = {
  // Code splitting
  lazyWithRetry,
  preloadComponent,
  prefetchComponents,

  // Monitoring
  measurePerformance,
  mark,
  measure,
  getPerformanceEntries,
  clearMarks,

  // Optimization
  debounce,
  throttle,
  memoize,

  // Intersection Observer
  createLazyLoadObserver,
  isInViewport,

  // Environment
  isClient,
  isServer,

  // Image optimization
  generateSrcSet,
  getImageFormat,

  // Memory
  clearFromMemory,
  getMemoryUsage,

  // Requests
  batchRequests,
  requestWithTimeout,
};
