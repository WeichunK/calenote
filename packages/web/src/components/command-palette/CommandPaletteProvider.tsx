/**
 * Command Palette Provider
 *
 * Provides command palette and shortcuts dialog to the entire app
 */

'use client';

import * as React from 'react';
import { CommandPalette } from './CommandPalette';
import { ShortcutsDialog } from './ShortcutsDialog';

// ==================== CONTEXT ====================

interface CommandPaletteContextValue {
  /**
   * Open the command palette
   */
  openCommandPalette: () => void;

  /**
   * Close the command palette
   */
  closeCommandPalette: () => void;

  /**
   * Toggle the command palette
   */
  toggleCommandPalette: () => void;

  /**
   * Open the shortcuts dialog
   */
  openShortcuts: () => void;

  /**
   * Set entry dialog opener
   */
  setEntryDialogOpener: (opener: () => void) => void;

  /**
   * Set task dialog opener
   */
  setTaskDialogOpener: (opener: () => void) => void;
}

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | null>(null);

// ==================== PROVIDER ====================

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [entryDialogOpener, setEntryDialogOpener] = React.useState<(() => void) | undefined>();
  const [taskDialogOpener, setTaskDialogOpener] = React.useState<(() => void) | undefined>();

  const value: CommandPaletteContextValue = React.useMemo(
    () => ({
      openCommandPalette: () => setCommandPaletteOpen(true),
      closeCommandPalette: () => setCommandPaletteOpen(false),
      toggleCommandPalette: () => setCommandPaletteOpen((prev) => !prev),
      openShortcuts: () => setShortcutsOpen(true),
      setEntryDialogOpener: (opener) => setEntryDialogOpener(() => opener),
      setTaskDialogOpener: (opener) => setTaskDialogOpener(() => opener),
    }),
    []
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        openEntryDialog={entryDialogOpener}
        openTaskDialog={taskDialogOpener}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </CommandPaletteContext.Provider>
  );
}

// ==================== HOOK ====================

/**
 * Hook to access command palette context
 */
export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);

  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }

  return context;
}
