/**
 * Command Palette Component
 *
 * A searchable command menu with keyboard shortcuts (Cmd+K / Ctrl+K)
 */

'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCommands, groupCommands, searchCommands } from '@/lib/commands/registry';
import { KEY_MAPPINGS } from '@/lib/commands/types';
import type { CommandContext } from '@/lib/commands/types';

// ==================== COMMAND PALETTE ====================

interface CommandPaletteProps {
  /**
   * Control open state externally
   */
  open?: boolean;

  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Functions to trigger dialogs
   */
  openEntryDialog?: () => void;
  openTaskDialog?: () => void;
}

export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
  openEntryDialog,
  openTaskDialog,
}: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Use controlled state if provided, otherwise internal
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Create command context
  const context: CommandContext = React.useMemo(
    () => ({
      pathname,
      navigate: (path: string) => {
        router.push(path);
        setOpen(false);
      },
      openEntryDialog: openEntryDialog
        ? () => {
            openEntryDialog();
            setOpen(false);
          }
        : undefined,
      openTaskDialog: openTaskDialog
        ? () => {
            openTaskDialog();
            setOpen(false);
          }
        : undefined,
    }),
    [pathname, router, openEntryDialog, openTaskDialog]
  );

  // Get all commands
  const allCommands = React.useMemo(() => getCommands(context), [context]);

  // Filter commands by search
  const filteredCommands = React.useMemo(() => {
    if (!search) return allCommands;
    return searchCommands(allCommands, search);
  }, [allCommands, search]);

  // Group filtered commands
  const commandGroups = React.useMemo(
    () => groupCommands(filteredCommands),
    [filteredCommands]
  );

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!isOpen);
      }

      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setOpen]);

  // Reset search when closing
  React.useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
            <motion.div
              className="w-full max-w-2xl"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.3 }}
            >
              <Command
                className="rounded-lg border bg-background shadow-2xl overflow-hidden"
                shouldFilter={false} // We handle filtering manually
              >
                {/* Search Input */}
                <div className="flex items-center border-b px-3">
                  <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
                  <Command.Input
                    placeholder="Type a command or search..."
                    className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    value={search}
                    onValueChange={setSearch}
                  />
                  <button
                    className="shrink-0 ml-2 p-1 rounded-sm hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-4 w-4 opacity-50" />
                  </button>
                </div>

                {/* Command List */}
                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                  {/* Empty State */}
                  <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                    No results found.
                  </Command.Empty>

                  {/* Command Groups */}
                  {commandGroups.map((group) => (
                    <Command.Group
                      key={group.category}
                      heading={group.heading}
                      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground mb-2"
                    >
                      {group.commands.map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <Command.Item
                            key={cmd.id}
                            value={cmd.id}
                            onSelect={() => {
                              cmd.action();
                              setOpen(false);
                            }}
                            className={cn(
                              'relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-2.5',
                              'select-none outline-none',
                              'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
                              'transition-colors'
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <div className="flex-1 flex flex-col">
                              <span className="text-sm font-medium">{cmd.title}</span>
                              {cmd.subtitle && (
                                <span className="text-xs text-muted-foreground">
                                  {cmd.subtitle}
                                </span>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <div className="flex items-center gap-1 ml-auto">
                                {cmd.shortcut.map((key, index) => (
                                  <kbd
                                    key={index}
                                    className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
                                  >
                                    {key}
                                  </kbd>
                                ))}
                              </div>
                            )}
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  ))}
                </Command.List>

                {/* Footer with hint */}
                <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span>
                    Use <kbd className="px-1 py-0.5 rounded bg-muted">↑</kbd>{' '}
                    <kbd className="px-1 py-0.5 rounded bg-muted">↓</kbd> to navigate
                  </span>
                  <span>
                    Press <kbd className="px-1 py-0.5 rounded bg-muted">{KEY_MAPPINGS.enter}</kbd> to
                    select
                  </span>
                </div>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ==================== COMMAND PALETTE TRIGGER ====================

interface CommandPaletteTriggerProps {
  /**
   * Custom trigger element
   */
  children?: React.ReactNode;

  /**
   * Callback when trigger is clicked
   */
  onClick?: () => void;
}

/**
 * Trigger button for command palette
 */
export function CommandPaletteTrigger({ children, onClick }: CommandPaletteTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-2',
        'text-sm text-muted-foreground',
        'hover:bg-muted hover:text-foreground',
        'transition-colors'
      )}
    >
      {children || (
        <>
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {KEY_MAPPINGS.mod}K
          </kbd>
        </>
      )}
    </button>
  );
}
