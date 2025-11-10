/**
 * Shortcuts Dialog Component
 *
 * Modal displaying all available keyboard shortcuts
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

// ==================== SHORTCUTS DIALOG ====================

interface ShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ShortcutsDialog({ open: controlledOpen, onOpenChange }: ShortcutsDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  const shortcuts = React.useMemo(() => getAllShortcuts(), []);

  // Listen for '?' key to toggle
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setOpen(!isOpen);
      }

      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };

    // Listen for custom event from command palette
    const handleOpenShortcuts = () => {
      setOpen(true);
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-shortcuts', handleOpenShortcuts);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-shortcuts', handleOpenShortcuts);
    };
  }, [isOpen, setOpen]);

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

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-lg border bg-background shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Keyboard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                    <p className="text-sm text-muted-foreground">
                      Navigate Calenote faster with keyboard shortcuts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shortcuts.map((group, groupIndex) => (
                    <motion.div
                      key={group.title}
                      className="space-y-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.1 }}
                    >
                      <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                      <div className="space-y-2">
                        {group.shortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <span className="text-sm text-muted-foreground">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  {keyIndex > 0 && (
                                    <span className="text-xs text-muted-foreground mx-1">then</span>
                                  )}
                                  <kbd
                                    className={cn(
                                      'inline-flex h-6 min-w-[24px] items-center justify-center',
                                      'rounded border border-border bg-muted px-2',
                                      'font-mono text-xs font-semibold text-foreground',
                                      'shadow-sm'
                                    )}
                                  >
                                    {key}
                                  </kbd>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t px-6 py-4 bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">
                    ?
                  </kbd>{' '}
                  to toggle this dialog
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ==================== SHORTCUTS TRIGGER ====================

interface ShortcutsTriggerProps {
  onClick?: () => void;
  children?: React.ReactNode;
}

/**
 * Trigger button for shortcuts dialog
 */
export function ShortcutsTrigger({ onClick, children }: ShortcutsTriggerProps) {
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
          <Keyboard className="h-4 w-4" />
          <span>Shortcuts</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ?
          </kbd>
        </>
      )}
    </button>
  );
}
