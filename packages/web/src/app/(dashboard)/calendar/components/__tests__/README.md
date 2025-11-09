# Calendar View Component Tests

This directory contains comprehensive test suites for all Calendar View components in the Calenote project.

## Test Coverage

### Components Tested

1. **EntryBadge** (`EntryBadge.test.tsx`)
   - Entry type icons (event, reminder, note)
   - Time display logic
   - Completed state styling
   - Custom colors
   - Compact mode
   - Click handling

2. **CalendarHeader** (`CalendarHeader.test.tsx`)
   - Month/year display
   - Navigation buttons (prev, next, today)
   - Click interactions
   - Accessibility labels

3. **CalendarCell** (`CalendarCell.test.tsx`)
   - Date display
   - Today indicator
   - Current month vs other month styling
   - Entry display (max 3 entries)
   - "+N more" button
   - Click handlers (date, entry, show more)

4. **CalendarGrid** (`CalendarGrid.test.tsx`)
   - 42-cell grid structure (6 weeks)
   - Weekday headers
   - Loading and error states
   - Entry grouping by date
   - Month coverage (includes prev/next month dates)

5. **DayEntriesModal** (`DayEntriesModal.test.tsx`)
   - Entry list display
   - Entry sorting (incomplete first, then by time, then by priority)
   - Entry type icons and time display
   - Completion toggle
   - Entry click and create actions
   - Priority indicators

6. **EntryDialog** (`EntryDialog.test.tsx`)
   - Create vs Edit mode
   - Form fields and validation
   - Title required, max 200 characters
   - Tag parsing (comma-separated)
   - Priority as number (not string)
   - Date pre-filling
   - Create, Update, Delete operations
   - Error handling and display
   - Form reset on close
   - Loading states

7. **CalendarView** (`CalendarView.test.tsx`)
   - Component rendering
   - Data fetching with correct date range
   - Dialog state management (discriminated union)
   - Dialog transitions (modal → dialog)
   - Calendar navigation
   - Entry grouping
   - Edge cases (empty data, undefined)

## Running Tests

### Install Dependencies

First, ensure all testing dependencies are installed:

```bash
cd packages/web
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage Report

```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory. Open `coverage/lcov-report/index.html` in your browser to view detailed coverage.

### Run Specific Test File

```bash
npm test -- EntryBadge.test.tsx
npm test -- CalendarView.test.tsx
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="displays entry type icon"
```

## Test Utilities

### `test-utils.tsx`

Provides helper functions for testing:

- **`renderWithProviders(ui, options)`**: Wraps component with React Query provider
- **`createTestQueryClient()`**: Creates a test-specific QueryClient with retry disabled
- **`createMockEntry(overrides)`**: Factory function for creating mock Entry objects
- **`createMockEntries(count, baseOverrides)`**: Create multiple mock entries

Example usage:

```typescript
import { renderWithProviders, createMockEntry } from './test-utils';

test('displays entry title', () => {
  const entry = createMockEntry({ title: 'Test Entry' });
  renderWithProviders(<EntryBadge entry={entry} onClick={mockFn} />);

  expect(screen.getByText('Test Entry')).toBeInTheDocument();
});
```

### `mocks.ts`

Provides mock implementations for React Query hooks:

- `mockUseEntries`: Mock for useEntries hook
- `mockUseCreateEntry`: Mock for useCreateEntry mutation
- `mockUseUpdateEntry`: Mock for useUpdateEntry mutation
- `mockUseDeleteEntry`: Mock for useDeleteEntry mutation
- `mockUseToggleEntryComplete`: Mock for useToggleEntryComplete mutation
- `mockUseCalendar`: Mock for useCalendar hook

## Test Structure

Each test file follows this structure:

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature Group', () => {
    test('specific behavior', () => {
      // Arrange
      const props = { ... };

      // Act
      renderWithProviders(<Component {...props} />);

      // Assert
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });
});
```

## Common Testing Patterns

### Testing User Interactions

```typescript
const { user } = renderWithProviders(<Component />);
const button = screen.getByRole('button', { name: /click me/i });
await user.click(button);

expect(mockCallback).toHaveBeenCalledTimes(1);
```

### Testing Async Operations

```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### Testing Form Inputs

```typescript
const input = screen.getByLabelText(/title/i);
await user.type(input, 'New Title');

expect(input).toHaveValue('New Title');
```

### Testing Conditional Rendering

```typescript
// Component should show loading state
expect(screen.getByText('Loading...')).toBeInTheDocument();
expect(screen.queryByText('Content')).not.toBeInTheDocument();
```

## Mocking Strategy

### Component Mocks

For integration tests (like CalendarView), child components are mocked to:
- Simplify test setup
- Isolate component behavior
- Speed up test execution
- Focus on state management and data flow

Example:

```typescript
jest.mock('../CalendarHeader', () => ({
  CalendarHeader: ({ onToday }: any) => (
    <button onClick={onToday}>Today</button>
  ),
}));
```

### Hook Mocks

React Query hooks are mocked to:
- Control data states (loading, error, success)
- Test mutation callbacks
- Avoid real API calls

Example:

```typescript
const mockUseEntries = {
  data: mockEntries,
  isLoading: false,
  error: null,
};

jest.mock('@/lib/hooks/useEntries', () => ({
  useEntries: jest.fn(() => mockUseEntries),
}));
```

## Testing Best Practices Applied

1. **Queries by Accessibility**: Use `getByRole`, `getByLabelText` over `getByTestId`
2. **User Events**: Use `@testing-library/user-event` for realistic interactions
3. **Async Handling**: Use `waitFor` for async assertions
4. **Mock Cleanup**: Clear mocks in `beforeEach`
5. **Isolation**: Each test is independent and can run in any order
6. **Descriptive Names**: Test names describe the expected behavior
7. **AAA Pattern**: Arrange, Act, Assert structure

## Debugging Tests

### View Rendered HTML

```typescript
import { screen, debug } from '@testing-library/react';

debug(); // Prints entire document
debug(screen.getByRole('button')); // Prints specific element
```

### Check What Queries Are Available

```typescript
screen.logTestingPlaygroundURL();
```

This logs a URL to Testing Playground with the current DOM.

### Run Single Test in Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand EntryBadge.test.tsx
```

Then open `chrome://inspect` in Chrome.

## CI/CD Integration

Tests are designed to run in CI environments:

- All tests are deterministic (no flaky tests)
- No external dependencies (mocked)
- Fast execution (< 30 seconds for full suite)
- Clear error messages on failure

Add to your CI pipeline:

```yaml
- name: Run tests
  run: |
    cd packages/web
    npm test -- --ci --coverage --maxWorkers=2
```

## Known Issues and Limitations

1. **Radix UI Components**: Some Radix UI components (Dialog, Select) may not work perfectly with JSDOM. Consider using `@testing-library/react` queries carefully.

2. **Date-fns Timezone**: Tests use specific dates (e.g., `new Date(2024, 2, 15)`). Ensure consistent timezone handling.

3. **Mock Complexity**: EntryDialog and CalendarView have complex mocks. If tests fail after component changes, check mock implementations first.

## Adding New Tests

When adding new calendar components:

1. Create test file: `ComponentName.test.tsx`
2. Import test utilities: `import { renderWithProviders, createMockEntry } from './test-utils'`
3. Mock external dependencies (hooks, child components)
4. Group tests by feature using `describe` blocks
5. Follow AAA pattern (Arrange, Act, Assert)
6. Test user behavior, not implementation details
7. Add edge cases and error scenarios

## Coverage Goals

Target coverage for calendar components:

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

Current coverage can be viewed by running:

```bash
npm run test:coverage
```

## Getting Help

- **React Testing Library Docs**: https://testing-library.com/docs/react-testing-library/intro
- **Jest Docs**: https://jestjs.io/docs/getting-started
- **Testing Playground**: https://testing-playground.com/

For questions about Calenote-specific testing patterns, refer to the main project documentation.
