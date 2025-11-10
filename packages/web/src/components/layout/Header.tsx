'use client';

import * as React from 'react';
import { Search, Bell, Settings, User, Menu, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/lib/stores/uiStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { useIsClient } from '@/lib/hooks/useIsClient';
import { useCommandPalette } from '@/components/command-palette/CommandPaletteProvider';
import { KEY_MAPPINGS } from '@/lib/commands/types';

export function Header() {
  const isClient = useIsClient();
  const toggleMobileSidebar = useUIStore((state) => state.toggleMobileSidebar);
  const { user, logout } = useAuthStore();
  const { openCommandPalette, openShortcuts } = useCommandPalette();

  const handleLogout = () => {
    logout();
    // Redirect to login page (only on client)
    if (isClient) {
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Command Palette Trigger - Desktop */}
        <button
          onClick={openCommandPalette}
          className="hidden md:flex flex-1 max-w-md items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Search entries, tasks...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {KEY_MAPPINGS.mod}K
          </kbd>
        </button>

        {/* Search - Mobile (Icon only) */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={openCommandPalette}>
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Spacer for mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Keyboard Shortcuts */}
          <Button variant="ghost" size="icon" onClick={openShortcuts}>
            <Keyboard className="h-5 w-5" />
            <span className="sr-only">Keyboard Shortcuts</span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.full_name || user?.username || 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
