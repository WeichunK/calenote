/**
 * Design System Tokens
 * Centralized constants for spacing, typography, and visual consistency
 */

// ==================== SPACING ====================

export const SPACING = {
  // Card/Container spacing
  card: {
    padding: 'p-4',           // 16px - Standard card padding
    paddingX: 'px-4',         // Horizontal padding
    paddingY: 'py-4',         // Vertical padding
    header: 'p-4 pb-3',       // Header with reduced bottom
    content: 'p-4 pt-3',      // Content with reduced top
  },

  // Section/Layout spacing
  section: {
    gap: 'space-y-6',         // 24px - Between major sections
    gapLarge: 'space-y-8',    // 32px - Extra spacing
    gapSmall: 'space-y-4',    // 16px - Between minor sections
  },

  // Inline/Flex spacing
  inline: {
    gap: 'gap-3',             // 12px - Standard inline gap
    gapSmall: 'gap-2',        // 8px - Compact inline gap
    gapLarge: 'gap-4',        // 16px - Larger inline gap
  },
} as const;

// ==================== TYPOGRAPHY ====================

export const TYPOGRAPHY = {
  // Page-level headings
  pageTitle: 'text-3xl font-bold tracking-tight',
  sectionTitle: 'text-2xl font-semibold',
  subsectionTitle: 'text-xl font-semibold',

  // Component headings
  cardTitle: 'text-lg font-semibold',
  cardSubtitle: 'text-base font-medium',

  // Body text
  body: 'text-base',
  bodyMuted: 'text-base text-muted-foreground',

  // Small text
  small: 'text-sm',
  smallMuted: 'text-sm text-muted-foreground',

  // Captions
  caption: 'text-xs',
  captionMuted: 'text-xs text-muted-foreground',
} as const;

// ==================== INTERACTIVE STATES ====================

export const INTERACTIVE = {
  // Hover states
  hover: {
    card: 'hover:shadow-md hover:scale-[1.01] transition-all duration-200',
    subtle: 'hover:bg-accent transition-colors duration-150',
    item: 'hover:bg-muted transition-colors duration-150',
    scale: 'hover:scale-105 transition-transform duration-150',
  },

  // Active/Focus states
  focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  active: 'active:scale-95 transition-transform duration-100',

  // Disabled state
  disabled: 'disabled:opacity-50 disabled:pointer-events-none',
} as const;

// ==================== BORDERS & SHADOWS ====================

export const VISUAL = {
  // Border radius
  radius: {
    sm: 'rounded-sm',         // 2px
    md: 'rounded-md',         // 4px
    lg: 'rounded-lg',         // 8px
    xl: 'rounded-xl',         // 12px
    full: 'rounded-full',     // 9999px
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    none: 'shadow-none',
  },

  // Borders
  border: {
    default: 'border',
    accent: 'border-l-4',     // Priority/accent indicator
    subtle: 'border border-border',
  },
} as const;

// ==================== ANIMATION DURATIONS ====================

export const ANIMATION = {
  duration: {
    fast: 150,                // Quick interactions (hover)
    normal: 200,              // Standard transitions
    slow: 300,                // Deliberate animations
  },

  easing: {
    default: 'ease-in-out',
    in: 'ease-in',
    out: 'ease-out',
  },
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Combine multiple token strings
 */
export function cx(...tokens: string[]): string {
  return tokens.join(' ');
}

/**
 * Standard card className
 */
export function cardClass(hover = true): string {
  return cx(
    VISUAL.radius.lg,
    VISUAL.border.subtle,
    SPACING.card.padding,
    hover ? INTERACTIVE.hover.card : ''
  );
}

/**
 * Standard list item className
 */
export function listItemClass(hover = true): string {
  return cx(
    VISUAL.radius.md,
    SPACING.card.padding,
    hover ? INTERACTIVE.hover.item : ''
  );
}
