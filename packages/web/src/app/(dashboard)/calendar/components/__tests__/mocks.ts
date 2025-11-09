import { jest } from '@jest/globals';

// Mock React Query hooks
export const createMockUseEntriesHook = (data: any = [], isLoading = false, error: any = null) => {
  return jest.fn(() => ({
    data,
    isLoading,
    error,
    isError: !!error,
    isSuccess: !isLoading && !error,
    refetch: jest.fn(),
  }));
};

export const createMockMutationHook = () => {
  const mutateAsync = jest.fn().mockResolvedValue({});
  const mutate = jest.fn();

  return jest.fn(() => ({
    mutate,
    mutateAsync,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    reset: jest.fn(),
  }));
};

export const createMockCalendarHook = (viewingMonth = new Date(2024, 2, 1)) => {
  return jest.fn(() => ({
    currentDate: new Date(2024, 2, 15),
    viewingMonth,
    goToToday: jest.fn(),
    goToPrevMonth: jest.fn(),
    goToNextMonth: jest.fn(),
  }));
};

// Default mock implementations for all hooks
export const mockUseEntries = createMockUseEntriesHook();
export const mockUseCreateEntry = createMockMutationHook();
export const mockUseUpdateEntry = createMockMutationHook();
export const mockUseDeleteEntry = createMockMutationHook();
export const mockUseToggleEntryComplete = createMockMutationHook();
export const mockUseCalendar = createMockCalendarHook();

// Reset all mocks
export function resetAllMocks() {
  mockUseEntries.mockClear();
  mockUseCreateEntry.mockClear();
  mockUseUpdateEntry.mockClear();
  mockUseDeleteEntry.mockClear();
  mockUseToggleEntryComplete.mockClear();
  mockUseCalendar.mockClear();
}
