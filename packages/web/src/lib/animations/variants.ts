/**
 * Animation Variants Library
 *
 * Centralized animation configurations for consistent motion design across the app.
 * Based on principles from Linear and Notion for smooth, performant animations.
 */

import { Variants, Transition } from 'framer-motion';

// ==================== TIMING CONSTANTS ====================

export const DURATION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
} as const;

export const EASING = {
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
} as const;

// ==================== COMMON TRANSITIONS ====================

export const transition = {
  fast: {
    duration: DURATION.fast,
    ease: EASING.easeOut,
  } as Transition,
  normal: {
    duration: DURATION.normal,
    ease: EASING.easeInOut,
  } as Transition,
  slow: {
    duration: DURATION.slow,
    ease: EASING.easeOut,
  } as Transition,
  spring: EASING.spring as Transition,
};

// ==================== FADE VARIANTS ====================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transition.fast,
  },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: transition.fast,
  },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transition.fast,
  },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: transition.fast,
  },
};

// ==================== SCALE VARIANTS ====================

export const scaleIn: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: transition.spring,
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: transition.fast,
  },
};

export const scaleInCenter: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: transition.spring,
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: transition.fast,
  },
};

// ==================== SLIDE VARIANTS ====================

export const slideInFromBottom: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: transition.normal,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: transition.fast,
  },
};

export const slideInFromTop: Variants = {
  initial: { y: '-100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: transition.normal,
  },
  exit: {
    y: '-100%',
    opacity: 0,
    transition: transition.fast,
  },
};

export const slideInFromRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: transition.normal,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: transition.fast,
  },
};

export const slideInFromLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: transition.normal,
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: transition.fast,
  },
};

// ==================== STAGGER VARIANTS ====================

export const staggerChildren: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerChildrenFast: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

export const staggerChildrenSlow: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// ==================== LIST ITEM VARIANTS ====================

export const listItem: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: transition.fast,
  },
};

// ==================== HOVER/TAP VARIANTS ====================

export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: transition.fast,
};

export const hoverScaleSmall = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: transition.fast,
};

export const hoverScaleLarge = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.99 },
  transition: transition.fast,
};

export const hoverLift = {
  whileHover: { y: -2, transition: transition.fast },
  whileTap: { y: 0, transition: transition.fast },
};

// ==================== DIALOG VARIANTS ====================

export const dialogOverlay: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast },
  },
};

export const dialogContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: transition.fast,
  },
};

export const sheetContent: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: { ...transition.normal, ease: EASING.easeOut },
  },
  exit: {
    y: '100%',
    transition: { ...transition.fast, ease: EASING.easeIn },
  },
};

// ==================== PAGE TRANSITION VARIANTS ====================

export const pageTransition: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: transition.fast,
  },
};

export const pageTransitionFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast },
  },
};

// ==================== CHECKBOX VARIANTS ====================

export const checkboxCheck: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: { ...transition.normal, ease: EASING.easeOut },
  },
  exit: {
    pathLength: 0,
    opacity: 0,
    transition: { duration: DURATION.fast },
  },
};

export const checkboxBox: Variants = {
  unchecked: {
    scale: 1,
    backgroundColor: 'transparent',
    borderColor: 'hsl(var(--border))',
  },
  checked: {
    scale: 1.1,
    backgroundColor: 'hsl(var(--primary))',
    borderColor: 'hsl(var(--primary))',
    transition: transition.spring,
  },
};

// ==================== LOADING VARIANTS ====================

export const spinner: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================== NOTIFICATION VARIANTS ====================

export const notification: Variants = {
  initial: { opacity: 0, y: -50, scale: 0.8 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transition.spring,
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.8,
    transition: transition.fast,
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Create a custom fade-in variant with custom offset
 */
export const createFadeInVariant = (yOffset: number = 20): Variants => ({
  initial: { opacity: 0, y: yOffset },
  animate: {
    opacity: 1,
    y: 0,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    y: -yOffset,
    transition: transition.fast,
  },
});

/**
 * Create a custom stagger variant with custom timing
 */
export const createStaggerVariant = (staggerDelay: number = 0.05): Variants => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: staggerDelay,
    },
  },
});

/**
 * Combine multiple variants
 */
export const combineVariants = (...variants: Variants[]): Variants => {
  return variants.reduce((acc, variant) => ({
    ...acc,
    ...variant,
  }), {});
};
