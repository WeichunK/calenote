import { describe, test, expect, jest, afterEach } from '@jest/globals';
import { screen } from '@testing-library/react';
import { CalendarGrid } from '../CalendarGrid';
import { renderWithProviders, createMockEntries } from './test-utils';

describe('CalendarGrid', () => {
  const mockOnDateClick = jest.fn();
  const mockOnEntryClick = jest.fn();
  const mockOnShowMore = jest.fn();

  afterEach(() => {
    mockOnDateClick.mockClear();
    mockOnEntryClick.mockClear();
    mockOnShowMore.mockClear();
  });

  describe('Grid Structure', () => {
    test('renders exactly 42 cells (6 weeks)', () => {
      const month = new Date(2024, 2, 1); // March 2024
      const entries = createMockEntries(5);

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={entries}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
          onShowMore={mockOnShowMore}
        />
      );

      const cells = screen.getAllByTestId('calendar-cell');
      expect(cells).toHaveLength(42);
    });

    test('renders weekday headers', () => {
      const month = new Date(2024, 2, 1);

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('displays loading message when isLoading is true', () => {
      const month = new Date(2024, 2, 1);

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('calendar-cell')).not.toBeInTheDocument();
    });

    test('does not display loading message when isLoading is false', () => {
      const month = new Date(2024, 2, 1);

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
          isLoading={false}
        />
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getAllByTestId('calendar-cell')).toHaveLength(42);
    });
  });

  describe('Error State', () => {
    test('displays error message when error is provided', () => {
      const month = new Date(2024, 2, 1);
      const error = new Error('Failed to load entries');

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
          error={error}
        />
      );

      expect(screen.getByText('Failed to load entries. Please try again.')).toBeInTheDocument();
      expect(screen.queryByTestId('calendar-cell')).not.toBeInTheDocument();
    });

    test('does not display error message when error is not provided', () => {
      const month = new Date(2024, 2, 1);

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      expect(screen.queryByText(/Failed to load entries/)).not.toBeInTheDocument();
      expect(screen.getAllByTestId('calendar-cell')).toHaveLength(42);
    });

    test('error state takes precedence over loading state', () => {
      const month = new Date(2024, 2, 1);
      const error = new Error('Test error');

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
          isLoading={true}
          error={error}
        />
      );

      expect(screen.getByText('Failed to load entries. Please try again.')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Entry Grouping', () => {
    test('groups entries by date correctly', () => {
      const month = new Date(2024, 2, 1); // March 2024
      const entries = [
        ...createMockEntries(2, { timestamp: '2024-03-15T10:00:00' }),
        ...createMockEntries(3, { timestamp: '2024-03-16T14:00:00' }),
      ];

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={entries}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      const cells = screen.getAllByTestId('calendar-cell');

      // Find the cell for March 15 (should have 2 entries, but each appears twice for mobile/desktop)
      const march15Cell = cells.find(cell => {
        const dateStr = cell.getAttribute('data-date');
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getDate() === 15 && date.getMonth() === 2;
      });
      expect(march15Cell).toBeInTheDocument();
      // 2 entries × 2 (mobile + desktop) = 4 entry badges
      expect(march15Cell?.querySelectorAll('[data-testid="entry-badge"]')).toHaveLength(4);

      // Find the cell for March 16 (should have 3 entries, but each appears twice for mobile/desktop)
      const march16Cell = cells.find(cell => {
        const dateStr = cell.getAttribute('data-date');
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getDate() === 16 && date.getMonth() === 2;
      });
      expect(march16Cell).toBeInTheDocument();
      // 3 entries × 2 (mobile + desktop) = 6 entry badges
      expect(march16Cell?.querySelectorAll('[data-testid="entry-badge"]')).toHaveLength(6);
    });

    test('handles entries without timestamps', () => {
      const month = new Date(2024, 2, 1);
      const entries = [
        ...createMockEntries(2, { timestamp: '2024-03-15T10:00:00' }),
        ...createMockEntries(1, { timestamp: undefined }), // Entry without timestamp
      ];

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={entries}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      // Should still render 42 cells
      expect(screen.getAllByTestId('calendar-cell')).toHaveLength(42);
    });
  });

  describe('Month Coverage', () => {
    test('includes days from previous and next month', () => {
      const month = new Date(2024, 2, 1); // March 2024 (starts on Friday)

      renderWithProviders(
        <CalendarGrid
          month={month}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      const cells = screen.getAllByTestId('calendar-cell');

      // First cell should be from previous month (February)
      const firstCell = cells[0];
      const firstDate = new Date(firstCell.getAttribute('data-date')!);
      expect(firstDate.getMonth()).toBe(1); // February (0-indexed)

      // Last cells should be from next month (April)
      const lastCell = cells[41];
      const lastDate = new Date(lastCell.getAttribute('data-date')!);
      expect(lastDate.getMonth()).toBe(3); // April (0-indexed)
    });
  });

  describe('Responsive Design', () => {
    test('has responsive weekday header classes', () => {
      const month = new Date(2024, 2, 1);

      const { container } = renderWithProviders(
        <CalendarGrid
          month={month}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      // Check for responsive classes on weekday headers
      const weekdayHeader = container.querySelector('.grid-cols-7');
      expect(weekdayHeader).toBeInTheDocument();
    });
  });
});
