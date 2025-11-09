import { describe, test, expect, jest } from '@jest/globals';
import { screen } from '@testing-library/react';
import { CalendarHeader } from '../CalendarHeader';
import { renderWithProviders } from './test-utils';

describe('CalendarHeader', () => {
  const mockOnPrevMonth = jest.fn();
  const mockOnNextMonth = jest.fn();
  const mockOnToday = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Display', () => {
    test('displays formatted month and year', () => {
      const currentMonth = new Date(2024, 2, 15); // March 2024

      renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      expect(screen.getByText('March 2024')).toBeInTheDocument();
    });

    test('displays correct month for different dates', () => {
      const currentMonth = new Date(2023, 11, 1); // December 2023

      renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      expect(screen.getByText('December 2023')).toBeInTheDocument();
    });
  });

  describe('Navigation Buttons', () => {
    test('renders previous month button', () => {
      const currentMonth = new Date(2024, 2, 15);

      renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous month/i });
      expect(prevButton).toBeInTheDocument();
    });

    test('renders next month button', () => {
      const currentMonth = new Date(2024, 2, 15);

      renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next month/i });
      expect(nextButton).toBeInTheDocument();
    });

    test('renders today button', () => {
      const currentMonth = new Date(2024, 2, 15);

      renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      const todayButton = screen.getByRole('button', { name: /today/i });
      expect(todayButton).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('calls onPrevMonth when previous button is clicked', async () => {
      const currentMonth = new Date(2024, 2, 15);

      const { user } = renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous month/i });
      await user.click(prevButton);

      expect(mockOnPrevMonth).toHaveBeenCalledTimes(1);
      expect(mockOnNextMonth).not.toHaveBeenCalled();
      expect(mockOnToday).not.toHaveBeenCalled();
    });

    test('calls onNextMonth when next button is clicked', async () => {
      const currentMonth = new Date(2024, 2, 15);

      const { user } = renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next month/i });
      await user.click(nextButton);

      expect(mockOnNextMonth).toHaveBeenCalledTimes(1);
      expect(mockOnPrevMonth).not.toHaveBeenCalled();
      expect(mockOnToday).not.toHaveBeenCalled();
    });

    test('calls onToday when today button is clicked', async () => {
      const currentMonth = new Date(2024, 2, 15);

      const { user } = renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      const todayButton = screen.getByRole('button', { name: /today/i });
      await user.click(todayButton);

      expect(mockOnToday).toHaveBeenCalledTimes(1);
      expect(mockOnPrevMonth).not.toHaveBeenCalled();
      expect(mockOnNextMonth).not.toHaveBeenCalled();
    });

    test('handles multiple clicks correctly', async () => {
      const currentMonth = new Date(2024, 2, 15);

      const { user } = renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous month/i });
      const nextButton = screen.getByRole('button', { name: /next month/i });

      await user.click(prevButton);
      await user.click(nextButton);
      await user.click(prevButton);

      expect(mockOnPrevMonth).toHaveBeenCalledTimes(2);
      expect(mockOnNextMonth).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('has accessible labels for icon buttons', () => {
      const currentMonth = new Date(2024, 2, 15);

      renderWithProviders(
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={mockOnPrevMonth}
          onNextMonth={mockOnNextMonth}
          onToday={mockOnToday}
        />
      );

      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    });
  });
});
