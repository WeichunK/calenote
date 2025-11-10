/**
 * useKeyboardShortcuts Hook
 *
 * Global keyboard shortcuts handler
 */

'use client';

import { useEffect, useCallback } from 'react';
import type { KeyboardShortcut, KeyModifiers } from '../commands/types';

// ==================== KEYBOARD SHORTCUTS HOOK ====================

/**
 * Parse key combination string into KeyboardEvent check
 */
function parseKeyCombo(combo: string): (e: KeyboardEvent) => boolean {
  const parts = combo.toLowerCase().split('+').map((s) => s.trim());

  return (e: KeyboardEvent) => {
    const ctrl = parts.includes('ctrl') || parts.includes('control');
    const meta = parts.includes('meta') || parts.includes('cmd') || parts.includes('⌘');
    const shift = parts.includes('shift') || parts.includes('⇧');
    const alt = parts.includes('alt') || parts.includes('option') || parts.includes('⌥');

    // Get the main key (last part after modifiers)
    const mainKey = parts[parts.length - 1].toLowerCase();

    // Check modifiers match
    if (ctrl && !e.ctrlKey) return false;
    if (meta && !e.metaKey) return false;
    if (shift && !e.shiftKey) return false;
    if (alt && !e.altKey) return false;

    // Check main key matches
    return e.key.toLowerCase() === mainKey;
  };
}

/**
 * Check if shortcuts should be disabled (e.g., when typing in input)
 */
function shouldDisableShortcuts(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  const tagName = target.tagName.toLowerCase();

  // Disable in input fields
  if (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  ) {
    return true;
  }

  return false;
}

/**
 * Register global keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing
      if (shouldDisableShortcuts(e)) {
        return;
      }

      // Check each shortcut
      for (const shortcut of shortcuts) {
        // Check if all keys in the combination match
        const allKeysMatch = shortcut.keys.every((combo) => {
          const checker = parseKeyCombo(combo);
          return checker(e);
        });

        if (allKeysMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.action();
          break; // Only trigger first matching shortcut
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

// ==================== COMMON SHORTCUTS ====================

/**
 * Get platform-specific modifier key name
 */
export function getModifierKey(): 'Meta' | 'Control' {
  if (typeof window === 'undefined') return 'Control';
  return navigator.platform.includes('Mac') ? 'Meta' : 'Control';
}

/**
 * Format shortcut for display
 */
export function formatShortcut(keys: string[]): string {
  const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac');

  return keys
    .map((key) => {
      const lower = key.toLowerCase();

      if (lower === 'meta' || lower === 'cmd') return isMac ? '⌘' : 'Ctrl';
      if (lower === 'ctrl' || lower === 'control') return 'Ctrl';
      if (lower === 'shift') return '⇧';
      if (lower === 'alt' || lower === 'option') return isMac ? '⌥' : 'Alt';

      return key.toUpperCase();
    })
    .join(isMac ? '' : '+');
}

/**
 * Extract modifiers from keyboard event
 */
export function getEventModifiers(e: KeyboardEvent): KeyModifiers {
  return {
    ctrl: e.ctrlKey,
    meta: e.metaKey,
    shift: e.shiftKey,
    alt: e.altKey,
  };
}

// ==================== PRESET SHORTCUTS ====================

/**
 * Common navigation shortcuts
 */
export const NAVIGATION_SHORTCUTS = {
  goToCalendar: ['g', 'c'],
  goToEntries: ['g', 'e'],
  goToTasks: ['g', 't'],
  goHome: ['g', 'h'],
} as const;

/**
 * Common action shortcuts
 */
export const ACTION_SHORTCUTS = {
  newEntry: ['n'],
  newTask: ['t'],
  quickEntry: ['q'],
  save: ['Meta+s', 'Ctrl+s'],
  cancel: ['Escape'],
} as const;

/**
 * Common search shortcuts
 */
export const SEARCH_SHORTCUTS = {
  search: ['/'],
  find: ['Meta+f', 'Ctrl+f'],
  commandPalette: ['Meta+k', 'Ctrl+k'],
} as const;

/**
 * Common UI shortcuts
 */
export const UI_SHORTCUTS = {
  closeDialog: ['Escape'],
  confirm: ['Enter'],
  focusInput: ['i'],
  toggleSidebar: ['['],
} as const;

// ==================== SHORTCUT GROUPS ====================

export interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

/**
 * Get all available shortcuts grouped by category
 */
export function getAllShortcuts(): ShortcutGroup[] {
  return [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['G', 'C'], description: 'Go to Calendar' },
        { keys: ['G', 'E'], description: 'Go to Entries' },
        { keys: ['G', 'T'], description: 'Go to Tasks' },
        { keys: ['G', 'H'], description: 'Go to Home' },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { keys: ['N'], description: 'Create New Entry' },
        { keys: ['T'], description: 'Create New Task' },
        { keys: ['Q'], description: 'Quick Entry' },
        { keys: [formatShortcut(['Meta', 'S'])], description: 'Save' },
      ],
    },
    {
      title: 'Search',
      shortcuts: [
        { keys: ['/'], description: 'Focus Search' },
        { keys: [formatShortcut(['Meta', 'K'])], description: 'Command Palette' },
        { keys: [formatShortcut(['Meta', 'F'])], description: 'Find in Page' },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { keys: ['?'], description: 'Show Shortcuts' },
        { keys: ['ESC'], description: 'Close Dialog' },
        { keys: ['↵'], description: 'Confirm' },
      ],
    },
  ];
}
