/**
 * Design Tokens
 *
 * Centralized design system constants for Calenote.
 * Inspired by Linear, Notion, and modern design systems.
 */

// ==================== COLORS ====================

/**
 * Semantic color names mapped to HSL values
 * These work with Tailwind's hsl() color system
 */
export const colors = {
  // Brand colors
  brand: {
    primary: '263 70% 50%', // Purple
    'primary-foreground': '0 0% 100%',
    secondary: '210 40% 96.1%',
    'secondary-foreground': '222.2 47.4% 11.2%',
  },

  // Semantic colors
  semantic: {
    success: '142 76% 36%',
    'success-foreground': '0 0% 100%',
    warning: '38 92% 50%',
    'warning-foreground': '0 0% 0%',
    error: '0 84.2% 60.2%',
    'error-foreground': '210 40% 98%',
    info: '199 89% 48%',
    'info-foreground': '0 0% 100%',
  },

  // Priority colors (for tasks/entries)
  priority: {
    none: '0 0% 62%', // Gray
    low: '120 60% 50%', // Green
    medium: '45 100% 50%', // Orange
    high: '0 100% 50%', // Red
  },

  // Status colors
  status: {
    active: '212 100% 48%', // Blue
    completed: '142 71% 45%', // Green
    archived: '0 0% 62%', // Gray
    cancelled: '0 84% 60%', // Red
  },

  // Entry type colors
  entryType: {
    event: '263 70% 50%', // Purple
    note: '142 76% 36%', // Green
    reminder: '38 92% 50%', // Orange
  },
} as const;

// ==================== SPACING ====================

/**
 * Spacing scale based on 4px unit
 * Follows a consistent ratio for visual harmony
 */
export const spacing = {
  unit: '0.25rem', // 4px base unit
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
} as const;

// ==================== TYPOGRAPHY ====================

/**
 * Type scale based on modular scale (1.25 ratio)
 * Optimized for readability and hierarchy
 */
export const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
    loose: '2',
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ==================== BORDER RADIUS ====================

/**
 * Border radius scale for consistent rounded corners
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// ==================== SHADOWS ====================

/**
 * Shadow scale for elevation and depth
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// ==================== Z-INDEX ====================

/**
 * Z-index scale to manage stacking order
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  notification: 1600,
  max: 9999,
} as const;

// ==================== BREAKPOINTS ====================

/**
 * Responsive breakpoints matching Tailwind's defaults
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ==================== ANIMATION DURATIONS ====================

/**
 * Animation timing constants
 */
export const durations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

// ==================== TRANSITIONS ====================

/**
 * Common transition configurations
 */
export const transitions = {
  default: 'all 0.2s ease-in-out',
  fast: 'all 0.15s ease-in-out',
  slow: 'all 0.3s ease-in-out',
  colors: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out',
  transform: 'transform 0.2s ease-in-out',
  opacity: 'opacity 0.2s ease-in-out',
} as const;

// ==================== COMPONENT SIZES ====================

/**
 * Standard component size variants
 */
export const componentSizes = {
  button: {
    sm: {
      height: '2rem', // 32px
      padding: '0 0.75rem',
      fontSize: typography.fontSize.sm,
    },
    md: {
      height: '2.5rem', // 40px
      padding: '0 1rem',
      fontSize: typography.fontSize.base,
    },
    lg: {
      height: '3rem', // 48px
      padding: '0 1.5rem',
      fontSize: typography.fontSize.lg,
    },
  },
  input: {
    sm: {
      height: '2rem',
      padding: '0 0.75rem',
      fontSize: typography.fontSize.sm,
    },
    md: {
      height: '2.5rem',
      padding: '0 1rem',
      fontSize: typography.fontSize.base,
    },
    lg: {
      height: '3rem',
      padding: '0 1.25rem',
      fontSize: typography.fontSize.lg,
    },
  },
  avatar: {
    sm: '2rem',
    md: '2.5rem',
    lg: '3rem',
    xl: '4rem',
  },
  icon: {
    sm: '1rem',
    md: '1.25rem',
    lg: '1.5rem',
    xl: '2rem',
  },
} as const;

// ==================== CALENDAR SPECIFIC ====================

/**
 * Calendar view specific tokens
 */
export const calendar = {
  cell: {
    minHeight: '6rem', // 96px
    padding: spacing[2],
  },
  entry: {
    height: '1.5rem', // 24px
    gap: spacing[1],
  },
  grid: {
    gap: spacing[1],
  },
} as const;

// ==================== LAYOUT ====================

/**
 * Layout constants
 */
export const layout = {
  header: {
    height: '4rem', // 64px
  },
  sidebar: {
    width: '16rem', // 256px
    collapsedWidth: '4rem', // 64px
  },
  container: {
    maxWidth: '80rem', // 1280px
    padding: spacing[6],
  },
  gap: {
    sm: spacing[4],
    md: spacing[6],
    lg: spacing[8],
  },
} as const;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get color value by path (e.g., "brand.primary")
 */
export const getColor = (path: string): string | undefined => {
  const parts = path.split('.');
  let current: any = colors;

  for (const part of parts) {
    if (current[part] === undefined) return undefined;
    current = current[part];
  }

  return current;
};

/**
 * Convert spacing token to CSS value
 */
export const getSpacing = (key: keyof typeof spacing): string => {
  return spacing[key];
};

/**
 * Create CSS custom property name
 */
export const cssVar = (name: string): string => {
  return `var(--${name})`;
};

/**
 * HSL color helper
 */
export const hsl = (color: string): string => {
  return `hsl(${color})`;
};

/**
 * HSLA color helper with alpha
 */
export const hsla = (color: string, alpha: number): string => {
  return `hsl(${color} / ${alpha})`;
};

// ==================== TYPE EXPORTS ====================

export type SpacingKey = keyof typeof spacing;
export type FontSizeKey = keyof typeof typography.fontSize;
export type FontWeightKey = keyof typeof typography.fontWeight;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
export type ZIndexKey = keyof typeof zIndex;
export type BreakpointKey = keyof typeof breakpoints;
export type DurationKey = keyof typeof durations;
