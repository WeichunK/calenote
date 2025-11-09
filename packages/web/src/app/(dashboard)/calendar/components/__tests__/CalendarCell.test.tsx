import { describe, test, expect, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import { CalendarCell } from '../CalendarCell';
import { renderWithProviders, createMockEntries, createMockEntry, getFirstByText } from './test-utils';

describe('CalendarCell', () => {
  const mockOnDateClick = jest.fn();
  const mockOnEntryClick = jest.fn();
  const mockOnShowMore = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Date Display', () => {
    test('displays date number correctly', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024

      renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    test('displays single digit dates correctly', () => {
      const date = new Date(2024, 2, 5); // March 5, 2024

      renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Today Indicator', () => {
    test('applies today styling when isToday is true', () => {
      const date = new Date(2024, 2, 15);

      const { container } = renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={true}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      const dateSpan = screen.getByText('15');
      expect(dateSpan).toHaveClass('bg-primary');
      expect(dateSpan).toHaveClass('text-primary-foreground');
      expect(dateSpan).toHaveClass('rounded-full');
    });

    test('does not apply today styling when isToday is false', () => {
      const date = new Date(2024, 2, 15);

      renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      const dateSpan = screen.getByText('15');
      expect(dateSpan).not.toHaveClass('bg-primary');
    });
  });

  describe('Month Styling', () => {
    test('applies muted styling for dates not in current month', () => {
      const date = new Date(2024, 2, 15);

      const { container } = renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={false}
          isToday={false}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      const cellDiv = container.querySelector('.bg-muted\\/30');
      expect(cellDiv).toBeInTheDocument();
    });

    test('does not apply muted styling for dates in current month', () => {
      const date = new Date(2024, 2, 15);

      const { container } = renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      const cellDiv = container.querySelector('.bg-muted\\/30');
      expect(cellDiv).not.toBeInTheDocument();
    });
  });

  describe('Entry Display', () => {
    test('displays up to 3 entries', () => {
      const date = new Date(2024, 2, 15);
      const entries = createMockEntries(3, { timestamp: '2024-03-15T10:00:00' });

      renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={entries}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      // Note: Each entry appears twice (mobile + desktop), so we use getAllByText
      expect(screen.getAllByText('Entry 1')).toHaveLength(2); // mobile + desktop
      expect(screen.getAllByText('Entry 2')).toHaveLength(2);
      expect(screen.getAllByText('Entry 3')).toHaveLength(2);
    });

    test('shows "+N more" button when more than 3 entries', () => {
      const date = new Date(2024, 2, 15);
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });

      renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={entries}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
          onShowMore={mockOnShowMore}
        />
      );

      // Only first 3 entries displayed (each appears twice: mobile + desktop)
      expect(screen.getAllByText('Entry 1')).toHaveLength(2);
      expect(screen.getAllByText('Entry 2')).toHaveLength(2);
      expect(screen.getAllByText('Entry 3')).toHaveLength(2);

      // "+2 more" button shown (only once - no responsive duplicate for this button)
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    test('does not show "+N more" button when 3 or fewer entries', () => {
      const date = new Date(2024, 2, 15);
      const entries = createMockEntries(2, { timestamp: '2024-03-15T10:00:00' });

      renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={entries}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
          onShowMore={mockOnShowMore}
        />
      );

      expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    test('does not show "+N more" button when onShowMore is not provided', () => {
      const date = new Date(2024, 2, 15);
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });

      renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={entries}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    test('displays no entries when array is empty', () => {
      const date = new Date(2024, 2, 15);

      renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      // Only the date number should be visible
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Entry/ })).not.toBeInTheDocument();
    });
  });

  describe('Click Interactions', () => {
    test('calls onDateClick when cell is clicked', async () => {
      const date = new Date(2024, 2, 15);

      const { user, container } = renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      // Click the cell div (not the entry badges)
      const cell = container.querySelector('div[class*="cursor-pointer"]');
      await user.click(cell!);

      expect(mockOnDateClick).toHaveBeenCalledTimes(1);
      expect(mockOnDateClick).toHaveBeenCalledWith(date);
    });

    test('calls onEntryClick when entry badge is clicked', async () => {
      const date = new Date(2024, 2, 15);
      const entry = createMockEntry({ title: 'Test Entry', timestamp: '2024-03-15T10:00:00' });

      const { user } = renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={[entry]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      // Get the first entry button (there are 2 due to mobile/desktop responsive design)
      const entryButtons = screen.getAllByText(/Test Entry/);
      await user.click(entryButtons[0]);

      expect(mockOnEntryClick).toHaveBeenCalledTimes(1);
      expect(mockOnEntryClick).toHaveBeenCalledWith(entry);
      // Date click should not be triggered when clicking entry
      expect(mockOnDateClick).not.toHaveBeenCalled();
    });

    test('calls onShowMore when "+N more" button is clicked', async () => {
      const date = new Date(2024, 2, 15);
      const entries = createMockEntries(5, { timestamp: '2024-03-15T10:00:00' });

      const { user } = renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={entries}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
          onShowMore={mockOnShowMore}
        />
      );

      const moreButton = screen.getByText('+2 more');
      await user.click(moreButton);

      expect(mockOnShowMore).toHaveBeenCalledTimes(1);
      expect(mockOnShowMore).toHaveBeenCalledWith(date);
      // Date click should not be triggered when clicking "+N more"
      expect(mockOnDateClick).not.toHaveBeenCalled();
    });
  });

  describe('Hover Effects', () => {
    test('applies hover classes to cell', () => {
      const date = new Date(2024, 2, 15);

      const { container } = renderWithProviders(
        <CalendarCell
          date={date}
          isCurrentMonth={true}
          isToday={false}
          entries={[]}
          onDateClick={mockOnDateClick}
          onEntryClick={mockOnEntryClick}
        />
      );

      const cell = container.querySelector('div[class*="cursor-pointer"]');
      expect(cell).toHaveClass('hover:bg-accent/50');
      expect(cell).toHaveClass('cursor-pointer');
    });
  });
});
