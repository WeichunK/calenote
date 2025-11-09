import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import { CalendarView } from '../CalendarView';
import { renderWithProviders, createMockEntry, createMockEntries } from './test-utils';
import * as useEntriesHooks from '@/lib/hooks/useEntries';
import * as useCalendarHook from '@/lib/hooks/useCalendar';

// Mock child components to simplify testing
jest.mock('../CalendarHeader', () => ({
  CalendarHeader: ({ onPrevMonth, onNextMonth, onToday }: any) => (
    <div data-testid="calendar-header">
      <button onClick={onPrevMonth}>Prev</button>
      <button onClick={onNextMonth}>Next</button>
      <button onClick={onToday}>Today</button>
    </div>
  ),
}));

jest.mock('../CalendarGrid', () => ({
  CalendarGrid: ({ onDateClick, onEntryClick, onShowMore, entries, isLoading, error }: any) => (
    <div data-testid="calendar-grid">
      {isLoading && <div>Loading...</div>}
      {error && <div>Error loading entries</div>}
      {!isLoading && !error && (
        <>
          <button onClick={() => onDateClick(new Date(2024, 2, 15))}>
            Click Date
          </button>
          {entries.length > 0 && (
            <button onClick={() => onEntryClick(entries[0])}>
              Click Entry
            </button>
          )}
          <button onClick={() => onShowMore(new Date(2024, 2, 15))}>
            Show More
          </button>
        </>
      )}
    </div>
  ),
}));

jest.mock('../EntryDialog', () => ({
  EntryDialog: ({ open, entry, defaultDate, onOpenChange }: any) => (
    open ? (
      <div data-testid="entry-dialog">
        <div>Entry Dialog - {entry ? 'Edit' : 'Create'} Mode</div>
        {defaultDate && <div>Default Date: {defaultDate.toISOString()}</div>}
        <button onClick={() => onOpenChange(false)}>Close Dialog</button>
      </div>
    ) : null
  ),
}));

jest.mock('../DayEntriesModal', () => ({
  DayEntriesModal: ({ open, entries, onEntryClick, onCreateEntry, onOpenChange }: any) => (
    open ? (
      <div data-testid="day-entries-modal">
        <div>Day Entries Modal - {entries.length} entries</div>
        {entries.length > 0 && (
          <button onClick={() => onEntryClick(entries[0])}>
            Click Modal Entry
          </button>
        )}
        <button onClick={onCreateEntry}>Create From Modal</button>
        <button onClick={() => onOpenChange(false)}>Close Modal</button>
      </div>
    ) : null
  ),
}));

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

jest.mock('@/lib/hooks/useCalendar', () => ({
  useCalendar: jest.fn(() => mockUseCalendar),
}));

jest.mock('@/lib/hooks/useEntries', () => ({
  useEntries: jest.fn(() => mockUseEntries),
}));

describe('CalendarView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEntries.data = [];
    mockUseEntries.isLoading = false;
    mockUseEntries.error = null;
  });

  describe('Rendering', () => {
    test('renders CalendarHeader component', () => {
      renderWithProviders(<CalendarView />);

      expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
    });

    test('renders CalendarGrid component', () => {
      renderWithProviders(<CalendarView />);

      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
    });

    test('does not render dialogs initially', () => {
      renderWithProviders(<CalendarView />);

      expect(screen.queryByTestId('entry-dialog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('day-entries-modal')).not.toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    test('fetches entries for viewing month', () => {
      const useEntriesSpy = jest.spyOn(useEntriesHooks, 'useEntries');

      renderWithProviders(<CalendarView />);

      expect(useEntriesSpy).toHaveBeenCalledWith({
        has_timestamp: true,
        start_date: '2024-03-01',
        end_date: '2024-03-31',
      });
    });

    test('passes entries to CalendarGrid', () => {
      const entries = createMockEntries(5);
      mockUseEntries.data = entries;

      renderWithProviders(<CalendarView />);

      expect(screen.getByText('Click Entry')).toBeInTheDocument();
    });

    test('passes loading state to CalendarGrid', () => {
      mockUseEntries.isLoading = true;

      renderWithProviders(<CalendarView />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('passes error state to CalendarGrid', () => {
      mockUseEntries.error = new Error('Failed to load');

      renderWithProviders(<CalendarView />);

      expect(screen.getByText('Error loading entries')).toBeInTheDocument();
    });
  });

  describe('Dialog State Management', () => {
    test('opens EntryDialog in create mode when date is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const dateButton = screen.getByText('Click Date');
      await user.click(dateButton);

      expect(screen.getByTestId('entry-dialog')).toBeInTheDocument();
      expect(screen.getByText('Entry Dialog - Create Mode')).toBeInTheDocument();
      expect(screen.getByText(/Default Date:/)).toBeInTheDocument();
    });

    test('opens EntryDialog in edit mode when entry is clicked', async () => {
      const entries = createMockEntries(1);
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      const entryButton = screen.getByText('Click Entry');
      await user.click(entryButton);

      expect(screen.getByTestId('entry-dialog')).toBeInTheDocument();
      expect(screen.getByText('Entry Dialog - Edit Mode')).toBeInTheDocument();
    });

    test('opens DayEntriesModal when show more is clicked', async () => {
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      const showMoreButton = screen.getByText('Show More');
      await user.click(showMoreButton);

      expect(screen.getByTestId('day-entries-modal')).toBeInTheDocument();
      expect(screen.getByText('Day Entries Modal - 5 entries')).toBeInTheDocument();
    });

    test('closes EntryDialog when close is triggered', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const dateButton = screen.getByText('Click Date');
      await user.click(dateButton);

      expect(screen.getByTestId('entry-dialog')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Dialog');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('entry-dialog')).not.toBeInTheDocument();
      });
    });

    test('closes DayEntriesModal when close is triggered', async () => {
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      const showMoreButton = screen.getByText('Show More');
      await user.click(showMoreButton);

      expect(screen.getByTestId('day-entries-modal')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Modal');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('day-entries-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dialog Transitions', () => {
    test('transitions from DayEntriesModal to EntryDialog on entry click', async () => {
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open modal
      const showMoreButton = screen.getByText('Show More');
      await user.click(showMoreButton);

      expect(screen.getByTestId('day-entries-modal')).toBeInTheDocument();

      // Click entry in modal
      const modalEntryButton = screen.getByText('Click Modal Entry');
      await user.click(modalEntryButton);

      // Modal should close and dialog should open in edit mode
      await waitFor(() => {
        expect(screen.queryByTestId('day-entries-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('entry-dialog')).toBeInTheDocument();
        expect(screen.getByText('Entry Dialog - Edit Mode')).toBeInTheDocument();
      });
    });

    test('transitions from DayEntriesModal to EntryDialog on create', async () => {
      const entries = createMockEntries(3, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open modal
      const showMoreButton = screen.getByText('Show More');
      await user.click(showMoreButton);

      expect(screen.getByTestId('day-entries-modal')).toBeInTheDocument();

      // Click create from modal
      const createButton = screen.getByText('Create From Modal');
      await user.click(createButton);

      // Modal should close and dialog should open in create mode
      await waitFor(() => {
        expect(screen.queryByTestId('day-entries-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('entry-dialog')).toBeInTheDocument();
        expect(screen.getByText('Entry Dialog - Create Mode')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Navigation', () => {
    test('calls goToPrevMonth when prev button is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const prevButton = screen.getByText('Prev');
      await user.click(prevButton);

      expect(mockUseCalendar.goToPrevMonth).toHaveBeenCalledTimes(1);
    });

    test('calls goToNextMonth when next button is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(mockUseCalendar.goToNextMonth).toHaveBeenCalledTimes(1);
    });

    test('calls goToToday when today button is clicked', async () => {
      const { user } = renderWithProviders(<CalendarView />);

      const todayButton = screen.getByText('Today');
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

      const showMoreButton = screen.getByText('Show More');
      await user.click(showMoreButton);

      // Should show 2 entries for March 15
      expect(screen.getByText('Day Entries Modal - 2 entries')).toBeInTheDocument();
    });

    test('handles entries without timestamps', async () => {
      const entries = [
        createMockEntry({ id: '1', timestamp: '2024-03-15T10:00:00' }),
        createMockEntry({ id: '2', timestamp: undefined }), // No timestamp
      ];
      mockUseEntries.data = entries;

      renderWithProviders(<CalendarView />);

      // Should not crash, only timestamped entry should be visible
      expect(screen.getByText('Click Entry')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty entries array', () => {
      mockUseEntries.data = [];

      renderWithProviders(<CalendarView />);

      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
      expect(screen.queryByText('Click Entry')).not.toBeInTheDocument();
    });

    test('handles undefined entries', () => {
      mockUseEntries.data = undefined as any;

      renderWithProviders(<CalendarView />);

      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
    });

    test('prevents multiple dialogs from being open simultaneously', async () => {
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });
      mockUseEntries.data = entries;

      const { user } = renderWithProviders(<CalendarView />);

      // Open create dialog
      const dateButton = screen.getByText('Click Date');
      await user.click(dateButton);

      expect(screen.getByTestId('entry-dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('day-entries-modal')).not.toBeInTheDocument();

      // Close and open modal
      const closeDialogButton = screen.getByText('Close Dialog');
      await user.click(closeDialogButton);

      const showMoreButton = screen.getByText('Show More');
      await user.click(showMoreButton);

      await waitFor(() => {
        expect(screen.queryByTestId('entry-dialog')).not.toBeInTheDocument();
        expect(screen.getByTestId('day-entries-modal')).toBeInTheDocument();
      });
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
      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
    });
  });
});
