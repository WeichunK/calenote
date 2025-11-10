/**
 * Animation Utility Functions
 *
 * Helper functions for creating and managing animations throughout the app.
 */

import { Variants, TargetAndTransition } from 'framer-motion';

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation variants with reduced motion support
 * Returns empty variants if user prefers reduced motion
 */
export const getVariants = (variants: Variants): Variants => {
  if (prefersReducedMotion()) {
    return {
      initial: {},
      animate: {},
      exit: {},
    };
  }
  return variants;
};

/**
 * Get transition with reduced motion support
 * Returns instant transition if user prefers reduced motion
 */
export const getTransition = (
  transition: TargetAndTransition
): TargetAndTransition => {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return transition;
};

/**
 * Delay execution by a specified number of milliseconds
 * Useful for sequencing animations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate random delay for stagger effect
 */
export const randomDelay = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Create spring transition with custom config
 */
export const createSpringTransition = (
  stiffness: number = 300,
  damping: number = 30,
  mass: number = 1
) => ({
  type: 'spring' as const,
  stiffness,
  damping,
  mass,
});

/**
 * Create tween transition with custom config
 */
export const createTweenTransition = (
  duration: number = 0.3,
  ease: number[] | string = [0.4, 0.0, 0.2, 1]
) => ({
  type: 'tween' as const,
  duration,
  ease,
});

/**
 * Animation orchestration helpers
 */
export const orchestrate = {
  /**
   * Sequence animations one after another
   */
  sequence: (delays: number[]): number[] => {
    return delays.reduce((acc, delay, index) => {
      acc.push(index === 0 ? delay : acc[index - 1] + delay);
      return acc;
    }, [] as number[]);
  },

  /**
   * Stagger animations with equal spacing
   */
  stagger: (count: number, interval: number): number[] => {
    return Array.from({ length: count }, (_, i) => i * interval);
  },

  /**
   * Create wave effect (center out)
   */
  wave: (count: number, centerIndex: number, interval: number): number[] => {
    return Array.from({ length: count }, (_, i) => {
      const distance = Math.abs(i - centerIndex);
      return distance * interval;
    });
  },
};

/**
 * Viewport-based animation triggers
 */
export const viewportConfig = {
  once: {
    once: true,
    amount: 0.3,
  },
  repeat: {
    once: false,
    amount: 0.3,
  },
  full: {
    once: true,
    amount: 0.8,
  },
};

/**
 * Drag constraints helper
 */
export const createDragConstraints = (
  element: HTMLElement | null
): { top: number; left: number; right: number; bottom: number } | undefined => {
  if (!element || !element.parentElement) return undefined;

  const parent = element.parentElement.getBoundingClientRect();
  const child = element.getBoundingClientRect();

  return {
    top: 0,
    left: 0,
    right: parent.width - child.width,
    bottom: parent.height - child.height,
  };
};

/**
 * Layout animation helpers
 */
export const layoutTransition = {
  default: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
  },
  fast: {
    type: 'spring' as const,
    stiffness: 700,
    damping: 35,
  },
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  },
};

/**
 * Animation state helpers
 */
export const animationStates = {
  /**
   * Check if element is in viewport
   */
  isInViewport: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  },

  /**
   * Get scroll progress (0-1) for an element
   */
  getScrollProgress: (element: HTMLElement): number => {
    const rect = element.getBoundingClientRect();
    const elementHeight = rect.height;
    const viewportHeight = window.innerHeight;
    const scrollProgress =
      (viewportHeight - rect.top) / (viewportHeight + elementHeight);
    return Math.max(0, Math.min(1, scrollProgress));
  },
};

/**
 * Performance helpers
 */
export const performanceHelpers = {
  /**
   * Use GPU acceleration for transforms
   */
  gpuAccelerate: {
    translateZ: 0,
    backfaceVisibility: 'hidden' as const,
    perspective: 1000,
  },

  /**
   * Will-change CSS property for animation performance
   */
  willChange: (properties: string[]): { willChange: string } => ({
    willChange: properties.join(', '),
  }),
};

/**
 * Common animation durations in seconds
 */
export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

/**
 * Common easing curves
 */
export const easings = {
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  linear: [0, 0, 1, 1],
  anticipate: [0.36, 0.66, 0.04, 1],
} as const;
