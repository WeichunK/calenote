'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { setupApiClient } from '@/lib/api-setup';
import { ConnectionIndicator } from '@/components/connection/ConnectionIndicator';

export function Providers({ children }: { children: React.ReactNode }) {
  // Track client-side mount to avoid hydration mismatch with DevTools
  const [isMounted, setIsMounted] = React.useState(false);

  // Setup API client on mount
  React.useEffect(() => {
    setupApiClient();
    setIsMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only render DevTools and ConnectionIndicator after client-side hydration */}
      {isMounted && (
        <>
          <ReactQueryDevtools initialIsOpen={false} />
          <ConnectionIndicator />
        </>
      )}
    </QueryClientProvider>
  );
}
