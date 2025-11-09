import { describe, test, expect, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import { EntryBadge } from '../EntryBadge';
import { renderWithProviders, createMockEntry } from './test-utils';

describe('EntryBadge', () => {
  const mockOnClick = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Entry Type Icons', () => {
    test('displays calendar icon for event type', () => {
      const entry = createMockEntry({ entry_type: 'event', title: 'Team Meeting' });
      renderWithProviders(<EntryBadge entry={entry} onClick={mockOnClick} />);

      expect(screen.getByText('📅')).toBeInTheDocument();
      expect(screen.getByText(/Team Meeting/)).toBeInTheDocument();
    });

    test('displays clock icon for reminder type', () => {
      const entry = createMockEntry({ entry_type: 'reminder', title: 'Call dentist' });
      renderWithProviders(<EntryBadge entry={entry} onClick={mockOnClick} />);

      expect(screen.getByText('⏰')).toBeInTheDocument();
      expect(screen.getByText(/Call dentist/)).toBeInTheDocument();
    });

    test('displays note icon for note type', () => {
      const entry = createMockEntry({ entry_type: 'note', title: 'Ideas' });
      renderWithProviders(<EntryBadge entry={entry} onClick={mockOnClick} />);

      expect(screen.getByText('📝')).toBeInTheDocument();
      expect(screen.getByText(/Ideas/)).toBeInTheDocument();
    });
  });

  describe('Time Display', () => {
    test('displays time for non-all-day entries with timestamp', () => {
      const entry = createMockEntry({
        timestamp: '2024-03-15T14:30:00',
        is_all_day: false,
        title: 'Lunch',
      });
      renderWithProviders(<EntryBadge entry={entry} onClick={mockOnClick} />);

      expect(screen.getByText('14:30')).toBeInTheDocument();
    });

    test('does not display time for all-day entries', () => {
      const entry = createMockEntry({
        timestamp: '2024-03-15T00:00:00',
        is_all_day: true,
        title: 'Birthday',
      });
      renderWithProviders(<EntryBadge entry={entry} onClick={mockOnClick} />);

      expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
    });

    test('does not display time when timestamp is missing', () => {
      const entry = createMockEntry({
        timestamp: undefined,
        title: 'Inbox item',
      });
      renderWithProviders(<EntryBadge entry={entry} onClick={mockOnClick} />);

      expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
    });
  });

  describe('Completed State', () => {
    test('applies opacity and line-through styling when completed', () => {
      const entry = createMockEntry({
        is_completed: true,
        title: 'Finished task',
      });
      const { container } = renderWithProviders(
        <EntryBadge entry={entry} onClick={mockOnClick} />
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('opacity-50');
      expect(button).toHaveClass('line-through');
    });

    test('does not apply completed styling when not completed', () => {
      const entry = createMockEntry({
        is_completed: false,
        title: 'Active task',
      });
      const { container } = renderWithProviders(
        <EntryBadge entry={entry} onClick={mockOnClick} />
      );

      const button = container.querySelector('button');
      expect(button).not.toHaveClass('opacity-50');
      expect(button).not.toHaveClass('line-through');
    });
  });

  describe('Color', () => {
    test('applies custom background color when provided', () => {
      const entry = createMockEntry({
        color: '#ff0000',
        title: 'Red entry',
      });
      const { container } = renderWithProviders(
        <EntryBadge entry={entry} onClick={mockOnClick} />
      );

      const button = container.querySelector('button');
      expect(button).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    test('does not apply background color when not provided', () => {
      const entry = createMockEntry({
        color: undefined,
        title: 'Default entry',
      });
      const { container } = renderWithProviders(
        <EntryBadge entry={entry} onClick={mockOnClick} />
      );

      const button = container.querySelector('button');
      expect(button).toHaveStyle({ backgroundColor: undefined });
    });
  });

  describe('Compact Mode', () => {
    test('applies smaller text size in compact mode', () => {
      const entry = createMockEntry({ title: 'Compact entry' });
      const { container } = renderWithProviders(
        <EntryBadge entry={entry} onClick={mockOnClick} compact={true} />
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('text-[10px]');
    });

    test('uses normal text size when not in compact mode', () => {
      const entry = createMockEntry({ title: 'Normal entry' });
      const { container } = renderWithProviders(
        <EntryBadge entry={entry} onClick={mockOnClick} compact={false} />
      );

      const button = container.querySelector('button');
      expect(button).not.toHaveClass('text-[10px]');
      expect(button).toHaveClass('text-xs');
    });
  });

  describe('Click Handling', () => {
    test('calls onClick with entry when clicked', async () => {
      const entry = createMockEntry({ title: 'Clickable entry' });
      const { user } = renderWithProviders(
        <EntryBadge entry={entry} onClick={mockOnClick} />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(entry);
    });

    test('stops propagation when clicked', async () => {
      const entry = createMockEntry({ title: 'Entry' });
      const parentOnClick = jest.fn();

      const { user, container } = renderWithProviders(
        <div onClick={parentOnClick}>
          <EntryBadge entry={entry} onClick={mockOnClick} />
        </div>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(parentOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Title Truncation', () => {
    test('applies truncate class to title', () => {
      const entry = createMockEntry({
        title: 'This is a very long entry title that should be truncated',
      });
      renderWithProviders(<EntryBadge entry={entry} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('truncate');
    });
  });
});
