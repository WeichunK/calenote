/**
 * Command Palette Types
 *
 * Type definitions for the command palette system
 */

import { LucideIcon } from 'lucide-react';

// ==================== COMMAND TYPES ====================

export type CommandCategory =
  | 'navigation'
  | 'actions'
  | 'search'
  | 'settings'
  | 'help';

export interface Command {
  /**
   * Unique command identifier
   */
  id: string;

  /**
   * Display title
   */
  title: string;

  /**
   * Optional subtitle/description
   */
  subtitle?: string;

  /**
   * Command category for grouping
   */
  category: CommandCategory;

  /**
   * Icon component
   */
  icon: LucideIcon;

  /**
   * Keyboard shortcut (e.g., "⌘K", "Ctrl+N")
   */
  shortcut?: string[];

  /**
   * Function to execute when command is selected
   */
  action: () => void | Promise<void>;

  /**
   * Optional condition to show/hide command
   */
  visible?: () => boolean;

  /**
   * Search keywords for fuzzy matching
   */
  keywords?: string[];

  /**
   * Command priority (higher = shown first)
   */
  priority?: number;
}

export interface CommandGroup {
  category: CommandCategory;
  heading: string;
  commands: Command[];
}

// ==================== KEYBOARD SHORTCUTS ====================

export interface KeyboardShortcut {
  /**
   * Key combination (e.g., "Ctrl+K", "Meta+N")
   */
  keys: string[];

  /**
   * Function to execute
   */
  action: () => void;

  /**
   * Description for help menu
   */
  description: string;

  /**
   * Only trigger in specific views (optional)
   */
  scope?: 'calendar' | 'entries' | 'tasks' | 'global';

  /**
   * Prevent default browser behavior
   */
  preventDefault?: boolean;
}

// ==================== CONTEXT ====================

export interface CommandContext {
  /**
   * Current pathname
   */
  pathname: string;

  /**
   * Current calendar ID
   */
  calendarId?: string;

  /**
   * Functions to trigger dialogs
   */
  openEntryDialog?: () => void;
  openTaskDialog?: () => void;

  /**
   * Navigation function
   */
  navigate: (path: string) => void;

  /**
   * Search function
   */
  search?: (query: string) => void;
}

// ==================== UTILITY TYPES ====================

/**
 * Keyboard event modifiers
 */
export interface KeyModifiers {
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
}

/**
 * Platform-specific key mappings
 */
export const KEY_MAPPINGS = {
  mod: typeof window !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl',
  modKey: typeof window !== 'undefined' && navigator.platform.includes('Mac') ? 'Meta' : 'Control',
  shift: '⇧',
  alt: typeof window !== 'undefined' && navigator.platform.includes('Mac') ? '⌥' : 'Alt',
  enter: '↵',
  backspace: '⌫',
  delete: '⌦',
  escape: 'Esc',
} as const;
