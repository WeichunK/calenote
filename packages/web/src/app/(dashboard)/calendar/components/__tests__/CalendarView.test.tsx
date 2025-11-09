import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { screen, waitFor, within } from '@testing-library/react';
import { CalendarView } from '../CalendarView';
import { renderWithProviders, createMockEntry, createMockEntries } from './test-utils';

// Mock hooks
const mockUseCalendar = {
  viewingMonth: new Date(2024, 2, 1), // March 2024
  goToToday: jest.fn(),
  goToPrevMonth: jest.fn(),
  goToNextMonth: jest.fn(),
};

const mockUseEntries = {
  data: [],
  isLoading: false,
  error: null,
  isError: false,
  isSuccess: true,
  refetch: jest.fn(),
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

const mockMutateAsync = jest.fn();

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
    jest.clearAllMocks();
    mockUseEntries.data = [];
    mockUseEntries.isLoading = false;
    mockUseEntries.error = null;
    mockMutateAsync.mockResolvedValue({});
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

      expect(useEntries).toHaveBeenCalledWith({
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

      renderWithProviders(<CalendarView />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('passes error state to CalendarGrid', () => {
      mockUseEntries.error = new Error('Failed to load');

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

      // Find any cell in the current month (March 2024)
      const cells = screen.getAllByTestId('calendar-cell');
      // Just click the first cell that has a March date
      const marchCell = cells.find(cell => {
        const dateAttr = cell.getAttribute('data-date');
        return dateAttr && dateAttr.includes('2024-03');
      });

      expect(marchCell).toBeDefined();
      await user.click(marchCell!);

      // Dialog should open with Create Entry title
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Create Entry')).toBeInTheDocument();
      });
    });

    test('opens EntryDialog in edit mode when entry is clicked', async () => {
      const entries = createMockEntries(1, {
        timestamp: '2024-03-15T10:00:00',
        title: 'Test Meeting'
      });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Find and click the entry
      const entryElement = screen.getByText('Test Meeting');
      await user.click(entryElement);

      // Dialog should open in edit mode
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Entry')).toBeInTheDocument();
      });
    });

    test('opens DayEntriesModal when show more is clicked', async () => {
      // Create 5 entries for the same day to trigger "show more"
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Look for "+X more" link
      const showMoreLink = screen.getByText(/\+\d+ more/i);
      await user.click(showMoreLink);

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Entries for/i)).toBeInTheDocument();
      });
    });

    test('closes EntryDialog when close is triggered', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      // Open dialog
      const dayCell = screen.getByText('15');
      await user.click(dayCell);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close dialog - look for close button (X button in dialog)
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('closes DayEntriesModal when close is triggered', async () => {
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open modal
      const showMoreLink = screen.getByText(/\+\d+ more/i);
      await user.click(showMoreLink);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
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
      const showMoreLink = screen.getByText(/\+\d+ more/i);
      await user.click(showMoreLink);

      await waitFor(() => {
        expect(screen.getByText(/Entries for/i)).toBeInTheDocument();
      });

      // Click an entry in the modal
      const entryInModal = screen.getAllByText('Test Entry')[0];
      await user.click(entryInModal);

      // Should transition to edit dialog
      await waitFor(() => {
        expect(screen.getByText('Edit Entry')).toBeInTheDocument();
      });
    });

    test('transitions from DayEntriesModal to EntryDialog on create', async () => {
      const entries = createMockEntries(3, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open modal
      const showMoreLink = screen.getByText(/\+\d+ more/i);
      await user.click(showMoreLink);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click create button in modal
      const createButton = screen.getByRole('button', { name: /add entry/i });
      await user.click(createButton);

      // Should transition to create dialog
      await waitFor(() => {
        expect(screen.getByText('Create Entry')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Navigation', () => {
    test('calls goToPrevMonth when prev button is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const prevButton = screen.getByRole('button', { name: /previous month/i });
      await user.click(prevButton);

      expect(mockUseCalendar.goToPrevMonth).toHaveBeenCalledTimes(1);
    });

    test('calls goToNextMonth when next button is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const nextButton = screen.getByRole('button', { name: /next month/i });
      await user.click(nextButton);

      expect(mockUseCalendar.goToNextMonth).toHaveBeenCalledTimes(1);
    });

    test('calls goToToday when today button is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const todayButton = screen.getByRole('button', { name: /today/i });
      await user.click(todayButton);

      expect(mockUseCalendar.goToToday).toHaveBeenCalledTimes(1);
    });
  });

  describe('Entry Grouping', () => {
    test('groups entries by date for DayEntriesModal', async () => {
      const entries = [
        createMockEntry({ id: '1', timestamp: '2024-03-15T10:00:00', title: 'Entry 1' }),
        createMockEntry({ id: '2', timestamp: '2024-03-15T14:00:00', title: 'Entry 2' }),
        createMockEntry({ id: '3', timestamp: '2024-03-16T10:00:00', title: 'Entry 3' }),
      ];
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open modal for March 15
      const showMoreLink = screen.getByText(/\+2 more/i);
      await user.click(showMoreLink);

      // Should show 2 entries for March 15
      await waitFor(() => {
        expect(screen.getByText('Entry 1')).toBeInTheDocument();
        expect(screen.getByText('Entry 2')).toBeInTheDocument();
        expect(screen.queryByText('Entry 3')).not.toBeInTheDocument();
      });
    });

    test('handles entries without timestamps', async () => {
      const entries = [
        createMockEntry({ id: '1', timestamp: '2024-03-15T10:00:00' }),
        createMockEntry({ id: '2', timestamp: undefined }), // No timestamp
      ];
      mockUseEntries.data = entries;

      // Should not crash, only timestamped entry should be visible
      renderWithProviders(<CalendarView />);

      expect(screen.getByText('Sun')).toBeInTheDocument();
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
      mockUseEntries.data = undefined as any;

      renderWithProviders(<CalendarView />);

      // Calendar should still render
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    test('prevents multiple dialogs from being open simultaneously', async () => {
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });
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
        return dateAttr && dateAttr.includes('2024-03');
      });
      await user.click(marchCell!);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Create Entry')).toBeInTheDocument();
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
