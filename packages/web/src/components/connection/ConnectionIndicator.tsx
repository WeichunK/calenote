'use client';

import { useWebSocketStore } from '@/lib/stores/websocketStore';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionIndicator() {
  const { status, reconnectAttempts } = useWebSocketStore();

  if (status === 'connected') {
    return null; // Hide when connected
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: RefreshCw,
          text: 'Connecting...',
          className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
          iconClassName: 'animate-spin',
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          text: `Reconnecting${reconnectAttempts > 0 ? ` (${reconnectAttempts})` : ''}...`,
          className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
          iconClassName: 'animate-spin',
        };
      case 'disconnected':
      case 'error':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
          iconClassName: '',
        };
      default:
        return {
          icon: Wifi,
          text: 'Unknown status',
          className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
          iconClassName: '',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50',
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'border text-sm font-medium',
        'backdrop-blur-sm shadow-lg',
        'md:top-20', // Account for Header height on desktop
        config.className
      )}
    >
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <span>{config.text}</span>
    </div>
  );
}
