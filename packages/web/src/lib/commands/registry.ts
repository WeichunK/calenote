/**
 * Command Registry
 *
 * Central registry for all available commands in the application
 */

import {
  Calendar,
  List,
  CheckSquare,
  Plus,
  Search,
  Settings,
  User,
  LogOut,
  Home,
  FileText,
  Clock,
  Tag,
  Filter,
  SortAsc,
  Moon,
  Sun,
  Keyboard,
  HelpCircle,
} from 'lucide-react';
import type { Command, CommandContext, CommandGroup } from './types';

// ==================== COMMAND DEFINITIONS ====================

/**
 * Get all available commands based on current context
 */
export function getCommands(context: CommandContext): Command[] {
  const { pathname, openEntryDialog, openTaskDialog, navigate } = context;

  const commands: Command[] = [
    // ==================== NAVIGATION ====================
    {
      id: 'nav-calendar',
      title: 'Go to Calendar',
      subtitle: 'View entries in calendar',
      category: 'navigation',
      icon: Calendar,
      shortcut: ['g', 'c'],
      action: () => navigate('/calendar'),
      keywords: ['calendar', 'view', 'date', 'month'],
      priority: 10,
    },
    {
      id: 'nav-entries',
      title: 'Go to Entries',
      subtitle: 'List all entries',
      category: 'navigation',
      icon: List,
      shortcut: ['g', 'e'],
      action: () => navigate('/entries'),
      keywords: ['entries', 'list', 'all'],
      priority: 9,
    },
    {
      id: 'nav-tasks',
      title: 'Go to Tasks',
      subtitle: 'Manage tasks and projects',
      category: 'navigation',
      icon: CheckSquare,
      shortcut: ['g', 't'],
      action: () => navigate('/tasks'),
      keywords: ['tasks', 'projects', 'kanban'],
      priority: 8,
    },
    {
      id: 'nav-home',
      title: 'Go to Home',
      subtitle: 'Return to dashboard',
      category: 'navigation',
      icon: Home,
      action: () => navigate('/'),
      keywords: ['home', 'dashboard'],
      priority: 7,
    },

    // ==================== ACTIONS ====================
    {
      id: 'action-new-entry',
      title: 'Create New Entry',
      subtitle: 'Add a new calendar entry',
      category: 'actions',
      icon: Plus,
      shortcut: ['n'],
      action: () => openEntryDialog?.(),
      visible: () => !!openEntryDialog,
      keywords: ['new', 'create', 'entry', 'add', 'note', 'event'],
      priority: 15,
    },
    {
      id: 'action-new-task',
      title: 'Create New Task',
      subtitle: 'Start a new task or project',
      category: 'actions',
      icon: CheckSquare,
      shortcut: ['t'],
      action: () => openTaskDialog?.(),
      visible: () => !!openTaskDialog,
      keywords: ['new', 'create', 'task', 'project', 'add'],
      priority: 14,
    },
    {
      id: 'action-quick-entry',
      title: 'Quick Entry',
      subtitle: 'Create entry with minimal details',
      category: 'actions',
      icon: FileText,
      shortcut: ['q'],
      action: () => openEntryDialog?.(),
      visible: () => !!openEntryDialog,
      keywords: ['quick', 'fast', 'entry', 'add'],
      priority: 13,
    },

    // ==================== SEARCH ====================
    {
      id: 'search-entries',
      title: 'Search Entries',
      subtitle: 'Find entries by title or content',
      category: 'search',
      icon: Search,
      shortcut: ['/'],
      action: () => {
        // Focus search input in header
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
        searchInput?.focus();
      },
      keywords: ['search', 'find', 'filter', 'entries'],
      priority: 12,
    },
    {
      id: 'search-by-tag',
      title: 'Search by Tag',
      subtitle: 'Filter entries by tags',
      category: 'search',
      icon: Tag,
      action: () => {
        navigate('/entries');
        // Could trigger tag filter UI
      },
      keywords: ['tag', 'label', 'category', 'filter'],
      priority: 11,
    },
    {
      id: 'filter-scheduled',
      title: 'Show Scheduled Entries',
      subtitle: 'Filter entries with timestamps',
      category: 'search',
      icon: Clock,
      action: () => {
        navigate('/entries');
        // Trigger scheduled filter
      },
      visible: () => pathname.includes('/entries'),
      keywords: ['scheduled', 'timestamp', 'dated', 'filter'],
      priority: 6,
    },
    {
      id: 'filter-unscheduled',
      title: 'Show Unscheduled Entries',
      subtitle: 'Filter entries without timestamps',
      category: 'search',
      icon: Filter,
      action: () => {
        navigate('/entries');
        // Trigger unscheduled filter
      },
      visible: () => pathname.includes('/entries'),
      keywords: ['unscheduled', 'inbox', 'filter'],
      priority: 5,
    },
    {
      id: 'sort-entries',
      title: 'Sort Entries',
      subtitle: 'Change entry sorting',
      category: 'search',
      icon: SortAsc,
      action: () => {
        // Could open sort options
      },
      visible: () => pathname.includes('/entries'),
      keywords: ['sort', 'order', 'arrange'],
      priority: 4,
    },

    // ==================== SETTINGS ====================
    {
      id: 'settings-profile',
      title: 'View Profile',
      subtitle: 'Manage your account',
      category: 'settings',
      icon: User,
      action: () => navigate('/settings/profile'),
      keywords: ['profile', 'account', 'user', 'settings'],
      priority: 3,
    },
    {
      id: 'settings-preferences',
      title: 'Preferences',
      subtitle: 'Customize app settings',
      category: 'settings',
      icon: Settings,
      action: () => navigate('/settings'),
      keywords: ['settings', 'preferences', 'options', 'config'],
      priority: 2,
    },
    {
      id: 'settings-theme-light',
      title: 'Light Mode',
      subtitle: 'Switch to light theme',
      category: 'settings',
      icon: Sun,
      action: () => {
        // Toggle theme to light
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      },
      visible: () => document.documentElement.classList.contains('dark'),
      keywords: ['theme', 'light', 'mode', 'appearance'],
      priority: 1,
    },
    {
      id: 'settings-theme-dark',
      title: 'Dark Mode',
      subtitle: 'Switch to dark theme',
      category: 'settings',
      icon: Moon,
      action: () => {
        // Toggle theme to dark
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      },
      visible: () => !document.documentElement.classList.contains('dark'),
      keywords: ['theme', 'dark', 'mode', 'appearance'],
      priority: 1,
    },
    {
      id: 'settings-logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      category: 'settings',
      icon: LogOut,
      action: () => {
        // Trigger logout
        const event = new CustomEvent('logout');
        window.dispatchEvent(event);
      },
      keywords: ['logout', 'signout', 'exit', 'leave'],
      priority: 0,
    },

    // ==================== HELP ====================
    {
      id: 'help-shortcuts',
      title: 'Keyboard Shortcuts',
      subtitle: 'View all keyboard shortcuts',
      category: 'help',
      icon: Keyboard,
      shortcut: ['?'],
      action: () => {
        // Open shortcuts modal
        const event = new CustomEvent('open-shortcuts');
        window.dispatchEvent(event);
      },
      keywords: ['help', 'shortcuts', 'keyboard', 'keys'],
      priority: 10,
    },
    {
      id: 'help-docs',
      title: 'Documentation',
      subtitle: 'Learn how to use Calenote',
      category: 'help',
      icon: HelpCircle,
      action: () => {
        window.open('https://calenote.dev/docs', '_blank');
      },
      keywords: ['help', 'docs', 'documentation', 'guide', 'tutorial'],
      priority: 9,
    },
  ];

  // Filter out invisible commands
  return commands.filter((cmd) => {
    if (cmd.visible && typeof cmd.visible === 'function') {
      return cmd.visible();
    }
    return true;
  });
}

/**
 * Group commands by category
 */
export function groupCommands(commands: Command[]): CommandGroup[] {
  const groups: Record<string, Command[]> = {};

  commands.forEach((cmd) => {
    if (!groups[cmd.category]) {
      groups[cmd.category] = [];
    }
    groups[cmd.category].push(cmd);
  });

  // Sort commands within each group by priority
  Object.keys(groups).forEach((category) => {
    groups[category].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  });

  const categoryHeadings: Record<CommandCategory, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    search: 'Search & Filter',
    settings: 'Settings',
    help: 'Help',
  };

  return Object.entries(groups).map(([category, commands]) => ({
    category: category as CommandCategory,
    heading: categoryHeadings[category as CommandCategory] || category,
    commands,
  }));
}

// ==================== SEARCH ====================

/**
 * Fuzzy search commands by query
 */
export function searchCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) {
    return commands;
  }

  const lowerQuery = query.toLowerCase();

  const scored = commands
    .map((cmd) => {
      let score = 0;

      // Title match (highest priority)
      if (cmd.title.toLowerCase().includes(lowerQuery)) {
        score += 100;
        // Bonus for exact start match
        if (cmd.title.toLowerCase().startsWith(lowerQuery)) {
          score += 50;
        }
      }

      // Subtitle match
      if (cmd.subtitle?.toLowerCase().includes(lowerQuery)) {
        score += 50;
      }

      // Keywords match
      if (cmd.keywords) {
        cmd.keywords.forEach((keyword) => {
          if (keyword.toLowerCase().includes(lowerQuery)) {
            score += 30;
          }
        });
      }

      // Command ID match (for power users)
      if (cmd.id.toLowerCase().includes(lowerQuery)) {
        score += 20;
      }

      return { cmd, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.cmd);
}
