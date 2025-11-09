# Testing Guide for Calenote Web

This document provides an overview of the testing infrastructure for the Calenote web application.

## Quick Start

```bash
# Install dependencies
cd packages/web
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Infrastructure

### Configuration

- **Jest Config**: `/packages/web/jest.config.js`
- **Jest Setup**: `/packages/web/jest.setup.js`
- **TypeScript**: Configured in `tsconfig.json`

### Dependencies

```json
{
  "@testing-library/jest-dom": "^6.1.5",
  "@testing-library/react": "^14.1.2",
  "@testing-library/user-event": "^14.5.1",
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0"
}
```

## Test Suites

### Calendar View Components

Location: `/packages/web/src/app/(dashboard)/calendar/components/__tests__/`

Comprehensive test coverage for all calendar view components:

1. **EntryBadge.test.tsx** (37 test cases)
   - Entry type icons
   - Time display logic
   - Completed state styling
   - Color customization
   - Compact mode
   - Click handling

2. **CalendarHeader.test.tsx** (11 test cases)
   - Month/year display
   - Navigation controls
   - Button interactions
   - Accessibility

3. **CalendarCell.test.tsx** (23 test cases)
   - Date display
   - Today indicator
   - Entry overflow handling
   - Click propagation
   - Month styling

4. **CalendarGrid.test.tsx** (16 test cases)
   - Grid structure (42 cells)
   - Weekday headers
   - Loading/error states
   - Entry grouping
   - Date range coverage

5. **DayEntriesModal.test.tsx** (27 test cases)
   - Entry list display
   - Sorting algorithms
   - Completion toggle
   - Priority indicators
   - Modal interactions

6. **EntryDialog.test.tsx** (33 test cases)
   - Create/Edit modes
   - Form validation
   - Tag parsing
   - Priority handling
   - CRUD operations
   - Error handling

7. **CalendarView.test.tsx** (21 test cases)
   - Component integration
   - State management
   - Dialog transitions
   - Navigation
   - Data fetching

**Total: 168 test cases**

### Test Utilities

**test-utils.tsx**
- `renderWithProviders()`: Wraps components with React Query provider
- `createTestQueryClient()`: Creates test-specific QueryClient
- `createMockEntry()`: Factory for mock Entry objects
- `createMockEntries()`: Batch mock entry creation

**mocks.ts**
- Mock implementations for all React Query hooks
- Reusable mock functions for testing

## Testing Patterns

### Component Testing

```typescript
import { renderWithProviders, createMockEntry } from './test-utils';

test('displays entry title', () => {
  const entry = createMockEntry({ title: 'Meeting' });
  renderWithProviders(<EntryBadge entry={entry} onClick={jest.fn()} />);

  expect(screen.getByText('Meeting')).toBeInTheDocument();
});
```

### User Interaction Testing

```typescript
test('calls onClick when clicked', async () => {
  const mockOnClick = jest.fn();
  const { user } = renderWithProviders(<Button onClick={mockOnClick}>Click</Button>);

  await user.click(screen.getByRole('button'));

  expect(mockOnClick).toHaveBeenCalledTimes(1);
});
```

### Form Testing

```typescript
test('validates title field', async () => {
  const { user } = renderWithProviders(<EntryDialog {...props} />);

  const titleInput = screen.getByLabelText(/title/i);
  await user.type(titleInput, 'New Entry');

  expect(titleInput).toHaveValue('New Entry');
});
```

### Async Testing

```typescript
test('displays success message', async () => {
  renderWithProviders(<Component />);

  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

## Mocking Strategy

### Component Mocks

Integration tests mock child components to isolate behavior:

```typescript
jest.mock('../ChildComponent', () => ({
  ChildComponent: ({ onClick }: any) => (
    <button onClick={onClick}>Mocked Child</button>
  ),
}));
```

### Hook Mocks

React Query hooks are mocked to control data states:

```typescript
jest.mock('@/lib/hooks/useEntries', () => ({
  useEntries: jest.fn(() => ({
    data: mockEntries,
    isLoading: false,
    error: null,
  })),
}));
```

## Coverage Goals

Target coverage metrics:

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

View coverage report:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Best Practices

1. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Test User Behavior**: Focus on what users see and do, not implementation
3. **Avoid Implementation Details**: Don't test internal state or methods
4. **Keep Tests Independent**: Each test should run in isolation
5. **Clear Test Names**: Describe the expected behavior
6. **Mock External Dependencies**: APIs, hooks, external libraries
7. **Use AAA Pattern**: Arrange, Act, Assert

## Running Tests in CI/CD

```yaml
- name: Test
  run: |
    cd packages/web
    npm ci
    npm test -- --ci --coverage --maxWorkers=2
```

## Debugging Tests

### View DOM

```typescript
import { screen, debug } from '@testing-library/react';

debug(); // Print entire document
debug(screen.getByRole('button')); // Print specific element
```

### Testing Playground

```typescript
screen.logTestingPlaygroundURL();
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand MyComponent.test.tsx
```

Then open `chrome://inspect` in Chrome.

## Common Issues

### Issue: "Cannot find module"

**Solution**: Check `moduleNameMapper` in `jest.config.js`

### Issue: "ReferenceError: document is not defined"

**Solution**: Ensure `testEnvironment: 'jest-environment-jsdom'` in config

### Issue: "Component not rendering"

**Solution**: Check if component needs providers (Router, Query, etc.)

### Issue: "Async test timeout"

**Solution**: Use `waitFor()` for async assertions, increase timeout if needed

## Adding New Tests

1. Create test file: `ComponentName.test.tsx`
2. Import utilities: `import { renderWithProviders } from './test-utils'`
3. Mock dependencies (hooks, child components)
4. Write test cases using `describe` and `test`
5. Run tests: `npm test -- ComponentName.test.tsx`
6. Check coverage: `npm run test:coverage`

## Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Testing Playground](https://testing-playground.com/)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Maintenance

- Update snapshots: `npm test -- -u`
- Clear cache: `npm test -- --clearCache`
- Run specific file: `npm test -- ComponentName.test.tsx`
- Update coverage thresholds in `jest.config.js` as project matures

---

For detailed information about calendar component tests, see:
`/packages/web/src/app/(dashboard)/calendar/components/__tests__/README.md`
