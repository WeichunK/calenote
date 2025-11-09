import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { screen, waitFor, fireEvent } from '@testing-library/react';

// Mock the useToggleEntryComplete hook BEFORE importing the component
const mockMutateAsync = jest.fn();
const mockMutate = jest.fn();
const mockReset = jest.fn();

jest.mock('@/lib/hooks/useEntries', () => ({
  useToggleEntryComplete: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    reset: mockReset,
  })),
}));

import { DayEntriesModal } from '../DayEntriesModal';
import { renderWithProviders, createMockEntry, createMockEntries } from './test-utils';

describe('DayEntriesModal', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnEntryClick = jest.fn();
  const mockOnCreateEntry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  describe('Display', () => {
    test('renders modal when open is true', () => {
      const date = new Date(2024, 2, 15);

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={[]}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      expect(screen.getByText('Friday, March 15, 2024')).toBeInTheDocument();
    });

    test('displays entry count in description', () => {
      const date = new Date(2024, 2, 15);
      const entries = createMockEntries(3);

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      expect(screen.getByText('3 entries on this day')).toBeInTheDocument();
    });

    test('displays singular "entry" for single entry', () => {
      const date = new Date(2024, 2, 15);
      const entries = createMockEntries(1);

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      expect(screen.getByText('1 entry on this day')).toBeInTheDocument();
    });

    test('displays empty state when no entries', () => {
      const date = new Date(2024, 2, 15);

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={[]}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      expect(screen.getByText('No entries on this day')).toBeInTheDocument();
    });
  });

  describe('Entry Sorting', () => {
    test('displays incomplete entries before completed entries', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({ id: '1', title: 'Completed Task', is_completed: true }),
        createMockEntry({ id: '2', title: 'Active Task', is_completed: false }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const entryElements = screen.getAllByTestId('modal-entry');

      // Active Task should appear first
      expect(entryElements[0]).toHaveTextContent('Active Task');
      expect(entryElements[1]).toHaveTextContent('Completed Task');
    });

    test('sorts by timestamp for entries with same completion status', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({
          id: '1',
          title: 'Afternoon Event',
          timestamp: '2024-03-15T14:00:00',
          is_completed: false,
        }),
        createMockEntry({
          id: '2',
          title: 'Morning Event',
          timestamp: '2024-03-15T09:00:00',
          is_completed: false,
        }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const entryElements = screen.getAllByTestId('modal-entry');

      // Morning Event should appear first
      expect(entryElements[0]).toHaveTextContent('Morning Event');
      expect(entryElements[1]).toHaveTextContent('Afternoon Event');
    });

    test('sorts by priority when timestamps are not available', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({ id: '1', title: 'Low Priority', priority: 1, timestamp: undefined }),
        createMockEntry({ id: '2', title: 'High Priority', priority: 3, timestamp: undefined }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const entryElements = screen.getAllByTestId('modal-entry');

      // High Priority should appear first
      expect(entryElements[0]).toHaveTextContent('High Priority');
      expect(entryElements[1]).toHaveTextContent('Low Priority');
    });
  });

  describe('Entry Display', () => {
    test('displays entry type icon', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({ entry_type: 'event', title: 'Meeting' }),
        createMockEntry({ entry_type: 'reminder', title: 'Call' }),
        createMockEntry({ entry_type: 'note', title: 'Note' }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      expect(screen.getByText('📅')).toBeInTheDocument();
      expect(screen.getByText('⏰')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    test('displays time for non-all-day entries', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({
          title: 'Meeting',
          timestamp: '2024-03-15T14:30:00',
          is_all_day: false,
        }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      expect(screen.getByText('14:30')).toBeInTheDocument();
    });

    test('displays "All day" badge for all-day entries', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({
          title: 'Birthday',
          is_all_day: true,
        }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      expect(screen.getByText('All day')).toBeInTheDocument();
    });

    test('displays entry content when available', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({
          title: 'Meeting',
          content: 'Discuss project updates',
        }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      expect(screen.getByText('Discuss project updates')).toBeInTheDocument();
    });

    test('displays tags when available', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({
          title: 'Task',
          tags: ['work', 'urgent'],
        }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    test('applies line-through to completed entries', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({
          title: 'Completed Task',
          is_completed: true,
        }),
      ];

      const { container } = renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const titleElement = screen.getByText('Completed Task');
      expect(titleElement).toHaveClass('line-through');
    });
  });

  describe('Interactions', () => {
    test('calls onEntryClick when entry is clicked', async () => {
      const date = new Date(2024, 2, 15);
      const entry = createMockEntry({ title: 'Test Entry' });

      const { user } = renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={[entry]}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const entryElement = screen.getByText('Test Entry').closest('.border-l-4');
      await user.click(entryElement!);

      expect(mockOnEntryClick).toHaveBeenCalledWith(entry);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    test('clicking checkbox does not trigger entry click', async () => {
      const date = new Date(2024, 2, 15);
      const entry = createMockEntry({ title: 'Task', is_completed: false });

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={[entry]}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const checkbox = screen.getByTestId('entry-checkbox');

      // Use fireEvent instead of userEvent for elements inside dialogs with pointer-events issues
      fireEvent.click(checkbox);

      // Wait a bit to ensure async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Entry click should not be triggered (stopPropagation works)
      expect(mockOnEntryClick).not.toHaveBeenCalled();

      // The modal should not close
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });

    test('calls onCreateEntry when Add Entry button is clicked', async () => {
      const date = new Date(2024, 2, 15);

      const { user } = renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={[]}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const addButton = screen.getByRole('button', { name: /add entry/i });
      await user.click(addButton);

      expect(mockOnCreateEntry).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    test('calls onOpenChange when Close button is clicked', async () => {
      const date = new Date(2024, 2, 15);

      const { user } = renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={[]}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      // Get the Close button by its text (the visible text, not the sr-only one)
      // The X button has sr-only text, the actual Close button has visible text
      const buttons = screen.getAllByRole('button', { name: /close/i });
      const closeButton = buttons.find(btn => btn.textContent === 'Close');
      await user.click(closeButton!);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Priority Indicators', () => {
    test('applies high priority border color', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({ title: 'High Priority', priority: 3 }),
      ];

      const { container } = renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const entryElement = screen.getByText('High Priority').closest('.border-l-4');
      expect(entryElement).toHaveClass('border-l-red-500');
    });

    test('applies medium priority border color', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({ title: 'Medium Priority', priority: 2 }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const entryElement = screen.getByText('Medium Priority').closest('.border-l-4');
      expect(entryElement).toHaveClass('border-l-yellow-500');
    });

    test('applies low priority border color', () => {
      const date = new Date(2024, 2, 15);
      const entries = [
        createMockEntry({ title: 'Low Priority', priority: 1 }),
      ];

      renderWithProviders(
        <DayEntriesModal
          open={true}
          onOpenChange={mockOnOpenChange}
          date={date}
          entries={entries}
          onEntryClick={mockOnEntryClick}
          onCreateEntry={mockOnCreateEntry}
        />
      );

      const entryElement = screen.getByText('Low Priority').closest('.border-l-4');
      expect(entryElement).toHaveClass('border-l-green-500');
    });
  });
});
