# Quick Testing Reference Card

## Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific file
npm test -- EntryBadge.test.tsx
```

## Common Patterns

### Basic Component Test

```typescript
import { renderWithProviders, screen } from './test-utils';

test('displays title', () => {
  renderWithProviders(<Component title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### User Interaction

```typescript
const { user } = renderWithProviders(<Component />);
await user.click(screen.getByRole('button'));
expect(mockCallback).toHaveBeenCalled();
```

### Form Input

```typescript
const input = screen.getByLabelText(/title/i);
await user.type(input, 'New Value');
expect(input).toHaveValue('New Value');
```

### Async Assertion

```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### Mock Entry

```typescript
import { createMockEntry } from './test-utils';

const entry = createMockEntry({
  title: 'Meeting',
  timestamp: '2024-03-15T10:00:00',
});
```

## Common Queries

```typescript
// Preferred (accessible)
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByText(/welcome/i)

// When necessary
screen.getByDisplayValue('value')
screen.getByTestId('custom-element')

// Assertions
expect(element).toBeInTheDocument()
expect(element).toHaveClass('active')
expect(element).toHaveValue('text')
expect(element).toBeDisabled()
```

## Debug Commands

```typescript
// Print DOM
debug()

// Print specific element
debug(screen.getByRole('button'))

// Get testing playground URL
screen.logTestingPlaygroundURL()
```

## Mock React Query Hook

```typescript
jest.mock('@/lib/hooks/useEntries', () => ({
  useEntries: jest.fn(() => ({
    data: mockEntries,
    isLoading: false,
    error: null,
  })),
}));
```

## Coverage Threshold

- Statements: 90%+
- Branches: 85%+
- Functions: 90%+
- Lines: 90%+
