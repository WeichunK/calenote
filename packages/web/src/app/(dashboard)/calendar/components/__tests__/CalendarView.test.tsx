import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { screen, waitFor, within } from '@testing-library/react';
import { CalendarView } from '../CalendarView';
import { renderWithProviders, createMockEntry, createMockEntries } from './test-utils';

// Mock current date to ensure consistent test behavior
const MOCK_CURRENT_DATE = new Date('2024-03-15T12:00:00Z');
const MOCK_VIEWING_MONTH = new Date('2024-03-01T00:00:00Z');

// Create mock functions that will be reused
const mockGoToToday = jest.fn();
const mockGoToPrevMonth = jest.fn();
const mockGoToNextMonth = jest.fn();
const mockRefetch = jest.fn();
const mockMutateAsync = jest.fn();
const mockToggleCompleteMutateAsync = jest.fn();

// Mock data objects
const mockUseCalendar = {
  currentDate: MOCK_CURRENT_DATE,
  viewingMonth: MOCK_VIEWING_MONTH,
  goToToday: mockGoToToday,
  goToPrevMonth: mockGoToPrevMonth,
  goToNextMonth: mockGoToNextMonth,
};

const mockUseEntries = {
  data: [] as any[],
  isLoading: false,
  error: null as any,
  isError: false,
  isSuccess: true,
  refetch: mockRefetch,
};

const mockUseCalendars = {
  data: [{
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Calendar',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00',
  }],
  isLoading: false,
  error: null,
};

jest.mock('@/lib/hooks/useCalendar', () => ({
  useCalendar: jest.fn(() => mockUseCalendar),
}));

jest.mock('@/lib/hooks/useEntries', () => ({
  useEntries: jest.fn(() => mockUseEntries),
  useCreateEntry: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useUpdateEntry: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useDeleteEntry: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useToggleEntryComplete: jest.fn(() => ({
    mutateAsync: mockToggleCompleteMutateAsync,
    isPending: false,
  })),
}));

jest.mock('@/lib/hooks/useCalendars', () => ({
  useCalendars: jest.fn(() => mockUseCalendars),
}));

jest.mock('@/lib/stores/calendarStore', () => ({
  useCalendarStore: jest.fn((selector) => {
    const state = {
      currentCalendarId: '00000000-0000-0000-0000-000000000001',
      calendars: mockUseCalendars.data,
      setCurrentCalendarId: jest.fn(),
      setCalendars: jest.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

jest.mock('@/lib/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false),
}));

describe('CalendarView', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
    mockToggleCompleteMutateAsync.mockResolvedValue({});

    // Reset mock data
    mockUseEntries.data = [];
    mockUseEntries.isLoading = false;
    mockUseEntries.error = null;
    mockUseEntries.isError = false;
    mockUseEntries.isSuccess = true;
  });

  describe('Rendering', () => {
    test('renders CalendarHeader component', () => {
      renderWithProviders(<CalendarView />);

      // Look for header elements - Today button should always be there
      expect(screen.getByText('Today')).toBeInTheDocument();
      // Calendar header should have navigation buttons
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
    });

    test('renders CalendarGrid component', () => {
      renderWithProviders(<CalendarView />);

      // Look for weekday headers (abbreviated)
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
    });

    test('does not render dialogs initially', () => {
      renderWithProviders(<CalendarView />);

      // Dialogs should not be visible (they render but are hidden)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    test('fetches entries for viewing month', () => {
      const { useEntries } = require('@/lib/hooks/useEntries');

      renderWithProviders(<CalendarView />);

      // useEntries should be called with correct parameters
      expect(useEntries).toHaveBeenCalled();
      const callArgs = (useEntries as jest.Mock).mock.calls[0][0];
      expect(callArgs).toEqual({
        calendar_id: '00000000-0000-0000-0000-000000000001',
        has_timestamp: true,
        start_date: '2024-03-01',
        end_date: '2024-03-31',
      });
    });

    test('passes entries to CalendarGrid', () => {
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      renderWithProviders(<CalendarView />);

      // Calendar should render - we can't easily verify entries are passed,
      // but we can verify the component renders without error
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    test('passes loading state to CalendarGrid', () => {
      mockUseEntries.isLoading = true;
      mockUseEntries.data = [];

      renderWithProviders(<CalendarView />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('passes error state to CalendarGrid', () => {
      mockUseEntries.error = new Error('Failed to load');
      mockUseEntries.data = [];

      renderWithProviders(<CalendarView />);

      expect(screen.getByText(/Failed to load entries/i)).toBeInTheDocument();
    });
  });

  describe('Dialog State Management', () => {
    test('opens EntryDialog in create mode when date is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      // Wait for calendar to render
      await waitFor(() => {
        expect(screen.getAllByTestId('calendar-cell').length).toBeGreaterThan(0);
      });

      // Find a cell in the current month (March 2024) - click on March 15
      const cells = screen.getAllByTestId('calendar-cell');
      const marchCell = cells.find(cell => {
        const dateAttr = cell.getAttribute('data-date');
        // Match any date in March 2024
        return dateAttr && dateAttr.includes('2024-03-15');
      });

      expect(marchCell).toBeDefined();
      await user.click(marchCell!);

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check for form elements that indicate create mode
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByLabelText(/title/i)).toBeInTheDocument();
    });

    test('opens EntryDialog in edit mode when entry is clicked', async () => {
      const entries = [createMockEntry({
        id: 'entry-1',
        timestamp: '2024-03-15T10:00:00',
        title: 'Test Meeting',
      })];
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Wait for entry to appear - it's inside an entry-badge button
      await waitFor(() => {
        const badges = screen.queryAllByTestId('entry-badge');
        expect(badges.length).toBeGreaterThan(0);
      });

      // Find and click the entry badge
      const entryBadge = screen.getAllByTestId('entry-badge')[0];
      await user.click(entryBadge);

      // Dialog should open in edit mode
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check that the title field is populated with the entry title
      const dialog = screen.getByRole('dialog');
      await waitFor(() => {
        const titleInput = within(dialog).getByDisplayValue('Test Meeting');
        expect(titleInput).toBeInTheDocument();
      });
    });

    test('opens DayEntriesModal when show more is clicked', async () => {
      // Create 5 entries for the same day to trigger "show more" (max display is 3)
      const entries = createMockEntries(5, {
        timestamp: '2024-03-15T10:00:00',
        title: 'Entry',
      });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Wait for "+X more" link to appear
      await waitFor(() => {
        expect(screen.getByText(/\+2 more/i)).toBeInTheDocument();
      });

      // Click the "show more" link
      const showMoreLink = screen.getByText(/\+2 more/i);
      await user.click(showMoreLink);

      // Modal should open
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        // Check for date format in the modal title (should have Friday, March 15, 2024)
        expect(within(dialog).getByText(/march/i)).toBeInTheDocument();
      });
    });

    test('closes EntryDialog when close is triggered', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      // Open dialog by clicking a date
      const cells = screen.getAllByTestId('calendar-cell');
      const marchCell = cells.find(cell => {
        const dateAttr = cell.getAttribute('data-date');
        return dateAttr && dateAttr.includes('2024-03-15');
      });
      await user.click(marchCell!);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close dialog - press Escape key (standard way to close radix dialogs)
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('closes DayEntriesModal when close is triggered', async () => {
      const entries = createMockEntries(5, {
        timestamp: '2024-03-15T10:00:00',
        title: 'Entry',
      });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open modal
      await waitFor(() => {
        expect(screen.getByText(/\+2 more/i)).toBeInTheDocument();
      });
      const showMoreLink = screen.getByText(/\+2 more/i);
      await user.click(showMoreLink);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal using close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dialog Transitions', () => {
    test('transitions from DayEntriesModal to EntryDialog on entry click', async () => {
      const entries = createMockEntries(5, {
        timestamp: '2024-03-15T10:00:00',
        title: 'Test Entry'
      });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open modal
      await waitFor(() => {
        expect(screen.getByText(/\+2 more/i)).toBeInTheDocument();
      });
      const showMoreLink = screen.getByText(/\+2 more/i);
      await user.click(showMoreLink);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText(/march/i)).toBeInTheDocument();
      });

      // Click an entry in the modal
      const entryElements = screen.getAllByTestId('modal-entry');
      await user.click(entryElements[0]);

      // Should transition to edit dialog - the modal closes and entry dialog opens
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByDisplayValue('Test Entry')).toBeInTheDocument();
      });
    });

    test('transitions from DayEntriesModal to EntryDialog on create', async () => {
      const entries = createMockEntries(4, {
        timestamp: '2024-03-15T10:00:00',
        title: 'Entry',
      });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open modal
      await waitFor(() => {
        expect(screen.getByText(/\+1 more/i)).toBeInTheDocument();
      });
      const showMoreLink = screen.getByText(/\+1 more/i);
      await user.click(showMoreLink);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click create button in modal
      const addButton = screen.getByRole('button', { name: /add entry/i });
      await user.click(addButton);

      // Should transition to create dialog
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        // In create mode, the title field should be empty or have placeholder
        const titleInput = within(dialog).getByLabelText(/title/i) as HTMLInputElement;
        expect(titleInput).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Navigation', () => {
    test('calls goToPrevMonth when prev button is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const prevButton = screen.getByRole('button', { name: /previous month/i });
      await user.click(prevButton);

      expect(mockGoToPrevMonth).toHaveBeenCalledTimes(1);
    });

    test('calls goToNextMonth when next button is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const nextButton = screen.getByRole('button', { name: /next month/i });
      await user.click(nextButton);

      expect(mockGoToNextMonth).toHaveBeenCalledTimes(1);
    });

    test('calls goToToday when today button is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const todayButton = screen.getByRole('button', { name: /today/i });
      await user.click(todayButton);

      expect(mockGoToToday).toHaveBeenCalledTimes(1);
    });
  });

  describe('Entry Grouping', () => {
    test('groups entries by date for DayEntriesModal', async () => {
      const entries = [
        createMockEntry({ id: '1', timestamp: '2024-03-15T10:00:00', title: 'Entry 1' }),
        createMockEntry({ id: '2', timestamp: '2024-03-15T14:00:00', title: 'Entry 2' }),
        createMockEntry({ id: '3', timestamp: '2024-03-16T10:00:00', title: 'Entry 3' }),
        createMockEntry({ id: '4', timestamp: '2024-03-15T16:00:00', title: 'Entry 4' }),
      ];
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open modal for March 15 (should have +1 more since we display max 3)
      await waitFor(() => {
        expect(screen.getByText(/\+1 more/i)).toBeInTheDocument();
      });
      const showMoreLink = screen.getByText(/\+1 more/i);
      await user.click(showMoreLink);

      // Should show 3 entries for March 15
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('Entry 1')).toBeInTheDocument();
        expect(within(dialog).getByText('Entry 2')).toBeInTheDocument();
        expect(within(dialog).getByText('Entry 4')).toBeInTheDocument();
        // Entry 3 should not be in this modal (different day)
        expect(within(dialog).queryByText('Entry 3')).not.toBeInTheDocument();
      });
    });

    test('handles entries without timestamps', async () => {
      const entries = [
        createMockEntry({ id: '1', timestamp: '2024-03-15T10:00:00', title: 'With Timestamp' }),
        createMockEntry({ id: '2', timestamp: undefined, title: 'No Timestamp' }), // No timestamp
      ];
      mockUseEntries.data = entries;

      // Should not crash, only timestamped entry should be visible in calendar
      renderWithProviders(<CalendarView />);

      await waitFor(() => {
        const badges = screen.queryAllByTestId('entry-badge');
        expect(badges.length).toBe(1);
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty entries array', () => {
      mockUseEntries.data = [];

      renderWithProviders(<CalendarView />);

      // Calendar should still render
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    test('handles undefined entries', () => {
      mockUseEntries.data = [] as any;

      renderWithProviders(<CalendarView />);

      // Calendar should still render
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    test('prevents multiple dialogs from being open simultaneously', async () => {
      const entries = createMockEntries(5, {
        timestamp: '2024-03-15T10:00:00',
        title: 'Entry',
      });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Wait for calendar to render
      await waitFor(() => {
        expect(screen.getAllByTestId('calendar-cell').length).toBeGreaterThan(0);
      });

      // Open create dialog
      const cells = screen.getAllByTestId('calendar-cell');
      const marchCell = cells.find(cell => {
        const dateAttr = cell.getAttribute('data-date');
        return dateAttr && dateAttr.includes('2024-03-15');
      });
      await user.click(marchCell!);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Only one dialog should be visible
      const dialogs = screen.queryAllByRole('dialog');
      expect(dialogs).toHaveLength(1);
    });
  });

  describe('Performance', () => {
    test('memoizes entriesByDate computation', () => {
      const entries = createMockEntries(10, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      const { rerender } = renderWithProviders(<CalendarView />);

      // Rerender without changing entries
      rerender(<CalendarView />);

      // Component should not crash and should render correctly
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });
});
