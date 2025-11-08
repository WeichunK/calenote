'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { setupApiClient } from '@/lib/api-setup';

export function Providers({ children }: { children: React.ReactNode }) {
  // Setup API client on mount
  React.useEffect(() => {
    setupApiClient();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
