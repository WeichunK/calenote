'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, List, CheckSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/uiStore';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  icon: typeof Calendar;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/entries', icon: List, label: 'Entries' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

function NavLink({
  item,
  isActive,
  onClick
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted'
      )}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, closeMobileSidebar } = useUIStore();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar - desktop always visible, mobile overlay when open */}
      <aside
        className={cn(
          'w-64 flex-col border-r bg-background z-50',
          'md:flex', // Always visible on desktop (>= 768px)
          isMobileSidebarOpen ? 'fixed inset-y-0 left-0 flex' : 'hidden md:flex' // Mobile: conditional, Desktop: always flex
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h1 className="text-2xl font-bold">Calenote</h1>
          {/* Close button only on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={closeMobileSidebar}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname.startsWith(item.href)}
              onClick={closeMobileSidebar}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
