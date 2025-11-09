# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Advanced Features (Epic 7): Comments, Attachments, Search
- Mobile App (Epic 8): React Native implementation
- Comprehensive testing suite
- Production deployment

## [0.6.1] - 2025-11-10

### Added - Task-Entry Association UI
- "Add Entry" button in Task View for creating entries within task context
- EntryDialog now supports `defaultTaskId` prop for pre-filling task association
- Seamless entry creation flow from Task View
- Improved user experience for task-entry relationship management

**Commit**: a8eb281

## [0.6.0] - 2025-11-10

### Added - Real-time Sync (Epic 6)
- Complete WebSocket implementation with auto-reconnection
- Exponential backoff retry strategy (1s → 2s → 4s → 8s → 16s → 30s max)
- Heartbeat/ping-pong mechanism (30s interval, 5s timeout)
- React Query cache integration for automatic UI updates
- Connection status tracking and UI indicator
- Message types: entry:created, entry:updated, entry:deleted, entry:completed, task:created, task:updated, task:deleted

**WebSocket Architecture** (8 files, ~737 lines of code):
- `types.ts` (53 lines) - Type definitions and interfaces
- `client.ts` (211 lines) - Core WebSocket client with reconnection logic
- `handlers.ts` (147 lines) - Message handlers and React Query integration
- `useWebSocket.ts` (81 lines) - React hook for WebSocket usage
- `singleton.ts` (49 lines) - Singleton pattern implementation
- `websocketStore.ts` (40 lines) - Zustand store for connection state
- `ConnectionIndicator.tsx` (58 lines) - UI component showing connection status
- `WebSocketProvider.tsx` (98 lines) - Provider component for app-wide WebSocket

**Commits**: d56b077 (initial implementation)

### Fixed - WebSocket Connection Cycling
- **CRITICAL**: Fixed "Insufficient resources" error from multiple simultaneous connections
- Root cause: Each React component mount was creating a new WebSocket instance
- Solution: Implemented singleton pattern to ensure only one connection per calendar
- Impact: Stable connection, reduced server load, eliminated connection cycling

**Commit**: fd62198

## [0.5.0] - 2025-11-09

### Added - Mobile Responsive Design (Epic 5.6)
- Mobile-responsive layouts across all views (Calendar, Entries, Tasks)
- Touch-optimized interactions for better mobile UX
- Responsive navigation with mobile-friendly sidebar
- Breakpoint-aware component rendering
- Tested and optimized for mobile viewport sizes

**Features**:
- Calendar View: Mobile-optimized date grid and entry display
- Entries View: Responsive filtering UI and entry list
- Tasks View: Mobile-friendly task cards and detail pages
- Navigation: Hamburger menu for mobile devices

**Commit**: 0b7533a

## [0.4.0] - 2025-11-09

### Added - Task View (Epic 5.5)
- Task Board with kanban-style layout
- Status filtering (All/Active/Completed/Archived)
- Task cards with progress bars and completion percentage
- Expandable entry lists within tasks
- Task create/edit dialogs with comprehensive form validation
- Task detail pages with full entry management
- Task deletion with confirmation dialogs
- Entry completion toggling from task view
- Toast notifications for user feedback
- Smart empty states and loading indicators

**Components Created** (4 total):
- `TaskCard.tsx` (183 lines) - Task card with progress visualization
- `TaskBoard.tsx` (122 lines) - Main task board with filtering
- `TaskDialog.tsx` (231 lines) - Task create/edit form
- `tasks/[id]/page.tsx` (218 lines) - Task detail page

**New Dependencies**:
- sonner (toast notifications)
- date-fns (date formatting)
- react-day-picker (date picker component)
- @radix-ui/react-dialog
- @radix-ui/react-select
- @radix-ui/react-popover

**Commit**: 649e1fa

## [0.3.0] - 2025-11-09

### Added - Entry List View (Epic 5.4)
- Comprehensive filtering system (entry type, timestamp presence, completion status)
- Flexible sorting (by created date, timestamp, priority, title)
- Smart date grouping (Today, This week, Earlier this week, Upcoming, Past, Unscheduled)
- Client-side filtering with useMemo for optimal performance
- Search functionality across entry titles and content
- Entry CRUD operations reusing EntryDialog from Calendar View

**Components Created** (3 total):
- `EntriesList.tsx` (266 lines) - Main entry list with smart grouping
- `FilterSortBar.tsx` (179 lines) - Filter and sort controls
- `EntriesPage.tsx` (176 lines) - Page container and state management

**Commit**: faf9a19

### Fixed - Entry View Issues
- Fixed 422 validation errors in entry creation
- Added missing PostCSS dependency
- Resolved transitive dependency resolution in monorepo workspace
- Fixed ReactQueryDevtools hydration mismatch

**Commits**: 8ced013, d2cdf0b, 5455b7a

## [0.2.0] - 2025-11-09

### Added - Calendar View (Epic 5.3)
- Complete calendar view with 42-cell grid (6 weeks display)
- Month navigation controls (previous, next, today)
- Entry display on calendar dates with type indicators
- Click date to create new entry
- Click entry to edit or delete
- Day entries modal to view all entries for a specific day
- Entry completion toggle
- Priority and tags support
- Responsive design for mobile and desktop
- 168 comprehensive test cases for calendar components
- Test utilities (renderWithProviders, createMockEntry)

**Components Created** (7 total):
- CalendarView - Main container with state management
- CalendarGrid - 42-cell grid with weekday headers
- CalendarCell - Individual day cell with entry display
- CalendarHeader - Month navigation bar
- EntryBadge - Entry display component with icons
- EntryDialog - Full CRUD form (create/edit/delete)
- DayEntriesModal - Day-specific entry list

**Commits**: 553817e, 2b5450d, 82e9df4, 667e2bd

### Fixed - Authentication Issues (Epic 2)
- **CRITICAL**: Fixed login 500 error caused by bcrypt/passlib version incompatibility
  - Root cause: bcrypt 4.x removed `__about__` attribute that passlib 1.7.4 depends on
  - Solution: Pinned bcrypt to version 3.2.2 in requirements.txt
- Fixed CORS-related errors (symptom of server crash before headers sent)
- Implemented AuthGuard component for route protection
- Fixed calendar_id management in CalendarView
- Updated calendars API types to match backend response

**Commits**: 054c7be

### Changed
- Test infrastructure improvements with scrollIntoView mock
- Improved EntryDialog test reliability
- Enhanced calendar component test suite

**Commits**: 667e2bd, dcacdec

## [0.1.0] - 2025-11-07

### Added - Authentication UI (Epic 2)
- User registration page with form validation
- Login page with JWT token management
- Protected route middleware
- Password confirmation validation
- Token storage in localStorage
- Redirect after successful authentication

**Commits**: 6f560f8

### Added - Dashboard Layout (Epic 5.1)
- Dashboard layout with navigation sidebar
- Route-based active state indicators
- Responsive layout for mobile/desktop
- Navigation between Calendar, Entries, Tasks views

**Commits**: 11d5744

### Added - Project Foundation (Epic 1)
- Next.js 16 project initialization with App Router
- React 19.2.0 setup
- Tailwind CSS 4 configuration
- shadcn/ui component library integration
- React Query for server state management
- TypeScript configuration
- Monorepo structure with shared packages
- Development environment setup
- Docker Compose configuration for services

**Commits**: 8661580

### Added - Backend Testing
- 111 comprehensive backend test cases
- WebSocket connection validation
- Entry API endpoint tests
- Task API endpoint tests
- Authentication flow tests

**Commits**: f79bc8e

## Test Account

For testing purposes, use the following credentials:

```
Email: demo@example.com
Password: demo123456
Username: demouser
Default Calendar: My Calendar
Calendar ID: 24cb508f-9585-4205-9824-742af56e04ab
```

## Migration Notes

### 0.2.0 Migration

**Important**: If upgrading from 0.1.0, you MUST ensure bcrypt version is correct:

```bash
# Backend
pip install -r requirements.txt --force-reinstall

# Verify bcrypt version
pip show bcrypt  # Should show version 3.2.2
```

**DO NOT** upgrade bcrypt to 4.x - it is incompatible with passlib 1.7.4.

## Dependencies

### Critical Version Constraints
- **bcrypt**: 3.2.2 (DO NOT upgrade to 4.x)
- **passlib**: 1.7.4

## Known Issues

### Test Suite (0.2.0)
- 84 of 116 frontend tests passing (72%)
- 32 failing tests primarily in EntryDialog and DayEntriesModal
- All critical user journeys functional in production
- Test infrastructure improvements ongoing

## Links

- [Project Repository](https://github.com/yourusername/calenote)
- [Documentation](./README.md)
- [Quick Start Guide](./START_HERE.md)
- [Task Breakdown](./03_TASKS.md)
