import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import { EntryDialog } from '../EntryDialog';
import { renderWithProviders, createMockEntry } from './test-utils';

// Mock functions that will be returned by the hooks
const mockMutateAsync = jest.fn();
const mockMutate = jest.fn();
const mockReset = jest.fn();

// Factory function to create mock mutation objects
const createMockMutation = (isPending = false) => ({
  mutateAsync: mockMutateAsync,
  mutate: mockMutate,
  isPending,
  isError: false,
  isSuccess: false,
  error: null,
  reset: mockReset,
});

// Create mock hooks with default values
const mockUseCreateEntry = jest.fn(() => createMockMutation());
const mockUseUpdateEntry = jest.fn(() => createMockMutation());
const mockUseDeleteEntry = jest.fn(() => createMockMutation());

jest.mock('@/lib/hooks/useEntries', () => ({
  useCreateEntry: (...args: any[]) => mockUseCreateEntry(...args),
  useUpdateEntry: (...args: any[]) => mockUseUpdateEntry(...args),
  useDeleteEntry: (...args: any[]) => mockUseDeleteEntry(...args),
}));

describe('EntryDialog', () => {
  const mockOnOpenChange = jest.fn();
  const calendarId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    jest.clearAllMocks();
    // Configure default success behavior for mutations
    mockMutateAsync.mockResolvedValue({});
    (global.confirm as jest.Mock).mockReturnValue(true);

    // Reset mock hooks to return default (non-pending) mutations
    mockUseCreateEntry.mockReturnValue(createMockMutation());
    mockUseUpdateEntry.mockReturnValue(createMockMutation());
    mockUseDeleteEntry.mockReturnValue(createMockMutation());
  });

  describe('Display Modes', () => {
    test('displays "Create Entry" title in create mode', () => {
      renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      expect(screen.getByRole('heading', { name: 'Create Entry' })).toBeInTheDocument();
      expect(screen.getByText('Create a new entry for your calendar.')).toBeInTheDocument();
    });

    test('displays "Edit Entry" title in edit mode', () => {
      const entry = createMockEntry({ title: 'Existing Entry' });

      renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          entry={entry}
          calendarId={calendarId}
        />
      );

      expect(screen.getByText('Edit Entry')).toBeInTheDocument();
      expect(screen.getByText('Make changes to your entry here.')).toBeInTheDocument();
    });

    test('shows Delete button only in edit mode', () => {
      const entry = createMockEntry({ title: 'Entry to Edit' });

      const { rerender } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();

      rerender(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          entry={entry}
          calendarId={calendarId}
        />
      );

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    test('displays all required form fields', () => {
      renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/all-day event/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date & time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date & time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      // Color label exists as text (not associated with a labellable element)
      const colorLabels = screen.getAllByText(/^color$/i);
      expect(colorLabels.length).toBeGreaterThan(0);
    });

    test('pre-fills form with entry data in edit mode', async () => {
      const entry = createMockEntry({
        title: 'Team Meeting',
        content: 'Discuss Q1 goals',
        entry_type: 'event',
        timestamp: '2024-03-15T14:30:00',
        priority: 2,
        tags: ['work', 'meeting'],
        color: '#ff0000',
      });

      renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          entry={entry}
          calendarId={calendarId}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Team Meeting')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Discuss Q1 goals')).toBeInTheDocument();
        expect(screen.getByDisplayValue('work, meeting')).toBeInTheDocument();
        // Color appears in both color picker and text input
        const colorInputs = screen.getAllByDisplayValue('#ff0000');
        expect(colorInputs).toHaveLength(2); // Color picker + text input
      });
    });

    test('pre-fills timestamp with default date in create mode', async () => {
      const defaultDate = new Date(2024, 2, 15, 10, 30); // March 15, 2024, 10:30

      renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          defaultDate={defaultDate}
          calendarId={calendarId}
        />
      );

      await waitFor(() => {
        const timestampInput = screen.getByLabelText(/start date & time/i) as HTMLInputElement;
        expect(timestampInput.value).toBe('2024-03-15T10:30');
      });
    });
  });

  describe('Form Validation', () => {
    test('shows error when title is empty', async () => {
      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);

      const submitButton = screen.getByRole('button', { name: /create entry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    test('shows error when title exceeds 200 characters', async () => {
      const longTitle = 'a'.repeat(201);

      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, longTitle);

      const submitButton = screen.getByRole('button', { name: /create entry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/200 characters or less/i)).toBeInTheDocument();
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Create Mode', () => {
    test('submits CreateEntryDTO with correct data', async () => {
      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Meeting');

      const contentInput = screen.getByLabelText(/description/i);
      await user.type(contentInput, 'Discuss project');

      const submitButton = screen.getByRole('button', { name: /create entry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            calendar_id: calendarId,
            title: 'New Meeting',
            content: 'Discuss project',
            entry_type: 'event',
          })
        );
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    test('parses tags correctly (comma-separated)', async () => {
      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Tagged Entry');

      const tagsInput = screen.getByLabelText(/tags/i);
      await user.type(tagsInput, 'work, urgent, meeting');

      const submitButton = screen.getByRole('button', { name: /create entry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['work', 'urgent', 'meeting'],
          })
        );
      });
    });

    test('stores priority as number', async () => {
      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'High Priority Task');

      // Open priority select and choose high priority
      const prioritySelect = screen.getByRole('combobox', { name: /priority/i });
      await user.click(prioritySelect);

      const highPriorityOption = screen.getByRole('option', { name: /high/i });
      await user.click(highPriorityOption);

      const submitButton = screen.getByRole('button', { name: /create entry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: 3, // Should be number, not string "3"
          })
        );
      });
    });

    test('closes dialog on successful creation', async () => {
      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Entry');

      const submitButton = screen.getByRole('button', { name: /create entry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Edit Mode', () => {
    test('submits UpdateEntryDTO with correct data', async () => {
      const entry = createMockEntry({
        id: 'entry-1',
        title: 'Original Title',
      });

      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          entry={entry}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByDisplayValue('Original Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 'entry-1',
          data: expect.objectContaining({
            title: 'Updated Title',
          }),
        });
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    test('closes dialog on successful update', async () => {
      const entry = createMockEntry({ title: 'Test' });

      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          entry={entry}
          calendarId={calendarId}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Delete Functionality', () => {
    test('shows confirmation dialog before deleting', async () => {
      const entry = createMockEntry({ id: 'entry-1', title: 'To Delete' });

      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          entry={entry}
          calendarId={calendarId}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this entry?');
    });

    test('deletes entry when confirmed', async () => {
      const entry = createMockEntry({ id: 'entry-1', title: 'To Delete' });
      (global.confirm as jest.Mock).mockReturnValue(true);

      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          entry={entry}
          calendarId={calendarId}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('entry-1');
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    test('does not delete entry when cancelled', async () => {
      const entry = createMockEntry({ id: 'entry-1', title: 'To Delete' });
      (global.confirm as jest.Mock).mockReturnValue(false);

      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          entry={entry}
          calendarId={calendarId}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('displays error message on mutation failure', async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('Network error'));

      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Entry');

      const submitButton = screen.getByRole('button', { name: /create entry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });

    test('displays generic error message for unknown errors', async () => {
      mockMutateAsync.mockRejectedValueOnce('Unknown error');

      const { user } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Entry');

      const submitButton = screen.getByRole('button', { name: /create entry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save entry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Reset', () => {
    test('resets form when dialog closes', async () => {
      const { rerender } = renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('');

      rerender(
        <EntryDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      rerender(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      await waitFor(() => {
        const newTitleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
        expect(newTitleInput.value).toBe('');
      });
    });
  });

  describe('Loading States', () => {
    test('disables submit button while mutation is pending', async () => {
      // Configure mock to return pending state
      mockUseCreateEntry.mockReturnValue(createMockMutation(true));

      renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          calendarId={calendarId}
        />
      );

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });

    test('disables delete button while deletion is pending', async () => {
      const entry = createMockEntry({ title: 'Test' });
      // Configure mock to return pending state
      mockUseDeleteEntry.mockReturnValue(createMockMutation(true));

      renderWithProviders(
        <EntryDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          entry={entry}
          calendarId={calendarId}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeDisabled();
    });
  });
});
