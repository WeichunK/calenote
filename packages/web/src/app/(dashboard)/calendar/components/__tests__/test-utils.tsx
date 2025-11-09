import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Entry } from '@calenote/shared';

// Create a new QueryClient for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Custom render function with React Query provider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    user: userEvent.setup(),
  };
}

// Counter for unique entry IDs
let entryIdCounter = 0;

// Mock Entry factory
export function createMockEntry(overrides: Partial<Entry> = {}): Entry {
  entryIdCounter++;
  return {
    id: `entry-${entryIdCounter}`,
    calendar_id: '00000000-0000-0000-0000-000000000001',
    title: 'Test Entry',
    content: 'Test content',
    entry_type: 'event',
    timestamp: '2024-03-15T10:00:00',
    end_timestamp: undefined,
    is_all_day: false,
    is_completed: false,
    completed_at: undefined,
    completed_by: undefined,
    priority: 0,
    tags: [],
    color: undefined,
    reminder_time: undefined,
    recurrence_rule: undefined,
    task_id: undefined,
    created_by: 'user-1',
    created_at: '2024-03-01T00:00:00',
    updated_at: '2024-03-01T00:00:00',
    last_modified_by: undefined,
    ...overrides,
  };
}

// Create multiple mock entries
export function createMockEntries(count: number, baseOverrides: Partial<Entry> = {}): Entry[] {
  return Array.from({ length: count }, (_, i) =>
    createMockEntry({
      id: `entry-${i + 1}`,
      title: `Entry ${i + 1}`,
      ...baseOverrides,
    })
  );
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { userEvent };
