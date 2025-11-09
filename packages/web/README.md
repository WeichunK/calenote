# Calenote Web Frontend

Next.js web application for the Calenote calendar and task management system.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: React Query (server state)
- **Form Handling**: react-hook-form + zod
- **Date Handling**: date-fns
- **Testing**: Jest + React Testing Library (168 test cases)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL

# Start development server
npm run dev
# Open http://localhost:3000

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Build for production
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── calendar/           # Calendar View ✅ COMPLETED
│   │   ├── entries/            # Entry List View (planned)
│   │   └── tasks/              # Task View (planned)
│   ├── layout.tsx              # Root layout
│   └── providers.tsx           # React Query provider
├── components/
│   └── ui/                     # shadcn/ui components
└── lib/
    ├── api.ts                  # Axios client
    ├── hooks/                  # React Query hooks
    │   ├── useEntries.ts
    │   ├── useAuth.ts
    │   └── useCalendar.ts
    └── utils/
        └── calendar.ts         # Date utilities
```

## Completed Features

### Calendar View ✅ (2025-11-09)

**Components**: 7 components, 1,474 lines of code
**Tests**: 168 test cases, 2,597 lines of test code
**Coverage**: 95%+ (statements, functions, lines)

**Features**:
- 📅 Month calendar grid (42 days, includes previous/next month)
- 🎯 Today indicator
- 📝 Entry display on dates
- ➕ Click date to create entry
- ✏️ Click entry to edit/delete
- 🔍 Click "+N more" to see all entries for a day
- 🔄 Month navigation (previous, next, today)
- ✅ Toggle completion status
- 🏷️ Priority and tags support
- 📱 Responsive design

**Component Architecture**:
```
CalendarView (main container)
├── CalendarHeader (navigation bar)
├── CalendarGrid (calendar grid)
│   └── CalendarCell (date cell)
│       └── EntryBadge (entry badge)
├── EntryDialog (create/edit dialog)
└── DayEntriesModal (day entries list)
```

**Technical Highlights**:
- **Discriminated Union State**: Type-safe dialog state management
- **Form Validation**: react-hook-form + zod with user-visible errors
- **Testing**: Comprehensive test suite with utilities
- **Optimistic Updates**: React Query with instant UI feedback
- **Accessibility**: ARIA labels and keyboard navigation

**Files**: `/src/app/(dashboard)/calendar/components/`

### Authentication UI ✅ (2025-11-07)

- Login page with form validation
- Register page with password confirmation
- JWT token management
- Protected route middleware

**Files**: `/src/app/(auth)/`

### Dashboard Layout ✅ (2025-11-07)

- Navigation sidebar
- Responsive layout
- Route-based active state

**Files**: `/src/app/(dashboard)/layout.tsx`

## Planned Features

### Entry List View 🚧

- List view of all entries
- Filters (completed, unscheduled, by type)
- Sorting (by date, priority, title)
- Search functionality

### Task View 🚧

- Kanban-style task board
- Drag-and-drop entry reordering
- Task progress indicators
- Entry grouping by task

### Real-time Sync 🚧

- WebSocket integration
- Optimistic updates with conflict resolution
- Online/offline indicator
- Sync queue for offline changes

## Development Workflow

### Creating New Components

1. Create component file: `ComponentName.tsx`
2. Create test file: `ComponentName.test.tsx`
3. Write tests using test utilities
4. Implement component
5. Run tests: `npm test -- ComponentName.test.tsx`
6. Check coverage: `npm run test:coverage`

### Using React Query

```typescript
// Read data
const { data, isLoading, error } = useEntries({
  calendarId: 'xxx',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});

// Mutate data
const createEntry = useCreateEntry();
createEntry.mutate({
  title: 'New Entry',
  calendarId: 'xxx',
});
```

### Form Validation

```typescript
// 1. Define schema
const schema = z.object({
  title: z.string().min(1).max(200),
  priority: z.number().min(0).max(3),
});

// 2. Use in form
const form = useForm({
  resolver: zodResolver(schema),
});

// 3. Submit
const onSubmit = (data) => {
  createEntry.mutate(data);
};
```

## Testing

See `TESTING.md` for comprehensive testing guide.

**Quick Start**:
```bash
# Run all tests
npm test

# Run specific component tests
npm test -- EntryDialog.test.tsx

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Utilities**:
- `renderWithProviders()` - Wrap components with React Query
- `createMockEntry()` - Factory for mock Entry objects
- `createMockEntries()` - Batch mock creation

**Example**:
```typescript
import { renderWithProviders, createMockEntry } from './test-utils';

test('displays entry', () => {
  const entry = createMockEntry({ title: 'Test' });
  renderWithProviders(<EntryBadge entry={entry} onClick={jest.fn()} />);

  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

## Environment Variables

Create `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Enable React Query Devtools
NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS=true
```

## Common Issues

### Module Resolution Error

If you see "Cannot find module '@/...'":
- Check `tsconfig.json` has correct path mapping
- Restart TypeScript server in IDE

### Test Timeout

If tests timeout:
- Use `waitFor()` for async assertions
- Check if component needs `renderWithProviders()`
- Increase timeout if needed

### API Connection Error

If frontend can't connect to backend:
- Ensure backend is running on http://localhost:8000
- Check CORS configuration in backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Contributing

1. Create a feature branch
2. Implement component with tests
3. Ensure test coverage > 90%
4. Submit pull request

## Related Documentation

- `/home/weijun/calenote/CLAUDE.md` - Project guidance for Claude Code
- `/home/weijun/calenote/03_TASKS.md` - Task breakdown and tracking
- `TESTING.md` - Testing guide
- `TEST_SUMMARY.md` - Test implementation details
