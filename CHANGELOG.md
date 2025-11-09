# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### In Progress
- Entry List View implementation
- Task View implementation
- Task Backend API

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
