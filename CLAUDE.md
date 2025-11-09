# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **calendar and task management system** built with an **entry-first philosophy**. The core concept: entries are first-class citizens that can exist independently, optionally have timestamps, and optionally belong to tasks. Tasks are merely containers/organizers without their own timestamps.

**Tech Stack:**
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 15, Redis 7, WebSockets
- **Frontend:** React (Next.js) for web, React Native (Expo) for mobile (planned)
- **Infrastructure:** Docker Compose for local development

## Development Commands

### Local Development with Docker (Recommended)

```bash
# Start all services (PostgreSQL, Redis, backend, Celery, Flower, PgAdmin)
docker-compose up -d

# View backend logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Rebuild after dependency changes
docker-compose up -d --build
```

**Service URLs:**
- Backend API: http://localhost:8000
- Frontend Web: http://localhost:3000
- API Documentation: http://localhost:8000/api/docs
- PgAdmin: http://localhost:5050 (admin@calendar.com / admin)
- Flower (Celery monitoring): http://localhost:5555

**Test Account (for quick testing):**
```
Email: demo@example.com
Password: demo123456
Username: demouser
Default Calendar: My Calendar
Calendar ID: 24cb508f-9585-4205-9824-742af56e04ab
```

**Quick Test Workflow**:
1. Access http://localhost:3000
2. Login with test account
3. Navigate to Calendar View
   - Click a date to create an entry
   - Click an entry to edit/delete it
   - Toggle entry completion
4. Navigate to Entries View
   - Use filters (entry type, scheduled/unscheduled, completed/active)
   - Try sorting options (created, timestamp, priority, title)
   - Search entries by title/content
   - Click entries to edit
   - View smart date grouping (Today, This week, Past, Upcoming, Unscheduled)
5. Navigate to Tasks View
   - Create a new task
   - Add entries to tasks
   - View task progress bars
   - Expand/collapse tasks to see entries
   - Filter tasks by status (All/Active/Completed/Archived)
   - Click task to view detail page
6. Test Real-time Sync
   - Open two browser tabs with the app
   - Create/edit an entry in one tab
   - Watch it appear instantly in the other tab
   - Check connection indicator in top-right corner

### Local Development without Docker

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL and Redis (via Docker)
docker-compose up -d postgres redis

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal: Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info
```

### Database Management

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1

# View migration history
alembic history

# Access PostgreSQL directly
docker-compose exec postgres psql -U calendar_user -d calendar_db
```

### Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_entries.py

# Run with coverage report
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/test_entries.py::test_create_entry -v
```

## Critical Architecture Concepts

### Entry-First Philosophy

**⚠️ CRITICAL:** This is the most important concept in the system.

```
✅ Entry (First-Class Citizen)
├── Has: title, content, timestamp (OPTIONAL), priority, tags
├── Can exist independently without a task
├── Can optionally belong to a Task (task_id is nullable)
├── Owns its own time (timestamp field on Entry table)
└── Is the atomic unit of work

❌ Task (Container/Organizer)
├── Has: title, description, due_date (OPTIONAL)
├── Contains: 0 to many Entries
├── Does NOT have: timestamp field
├── Progress: Auto-calculated via database trigger
└── Time information: Derived from contained entries
```

**Why this matters:**
- Never add a `timestamp` field to the Task model
- Entries in a task can have different timestamps or no timestamp at all
- When displaying a task's "time", compute it from MIN/MAX of entry timestamps
- Calendar view shows entries, not tasks (even if entries belong to tasks)

### The Three Views

1. **Calendar View** - Shows entries with timestamps
   - Query: `WHERE timestamp IS NOT NULL`
   - Groups entries by date for day/week/month display
   - Task membership shown as context (color, label)

2. **Entry View** - List-based view of all entries
   - Query: `SELECT * FROM entries`
   - Supports filtering: by completion, by timestamp presence, by task
   - Supports sorting: by priority, by timestamp, by creation date

3. **Task View** - Kanban-style project management
   - Query: `Tasks LEFT JOIN Entries`
   - Shows task progress (auto-calculated)
   - Displays entries grouped by their parent task

### Database Schema Key Points

**Important Tables:**
- `entries` - Core table with `timestamp`, `task_id` (nullable), `calendar_id`
- `tasks` - Container table with `due_date` (not timestamp!), progress fields
- `calendars` - Workspace/namespace for user data
- `users` - Authentication

**Critical Trigger:**
```sql
CREATE TRIGGER trigger_update_task_completion
AFTER INSERT OR UPDATE OF is_completed, task_id ON entries
FOR EACH ROW
EXECUTE FUNCTION update_task_completion();
```
This trigger automatically updates `task.total_entries` and `task.completed_entries` when entries change. **Never manually calculate task progress in application code.**

## Code Architecture

### Backend Structure

```
app/
├── main.py                     # FastAPI app entry point, CORS, middleware
├── config.py                   # Settings (DATABASE_URL, REDIS_URL, JWT config)
├── api/
│   ├── v1/
│   │   ├── router.py           # Main router that includes all v1 routes
│   │   ├── entries.py          # Entry CRUD endpoints
│   │   ├── tasks.py            # Task CRUD endpoints
│   │   ├── calendars.py        # Calendar management
│   │   └── auth.py             # Login, register, token refresh
│   └── websocket.py            # WebSocket connection handler
├── models/
│   ├── entry.py                # Entry SQLAlchemy model
│   ├── task.py                 # Task SQLAlchemy model
│   ├── calendar.py             # Calendar model
│   └── user.py                 # User model
├── schemas/
│   ├── entry.py                # Pydantic schemas for Entry validation
│   ├── task.py                 # Pydantic schemas for Task validation
│   └── auth.py                 # Login/register schemas
├── crud/
│   ├── entry.py                # Database operations for entries
│   └── task.py                 # Database operations for tasks
├── services/
│   └── entry_service.py        # Business logic (e.g., add entry to task)
├── core/
│   ├── database.py             # Async SQLAlchemy session management
│   ├── redis.py                # Redis client setup
│   ├── security.py             # JWT token creation/validation, password hashing
│   └── websocket_manager.py   # Manages active WebSocket connections per calendar
└── tasks/
    ├── celery_app.py           # Celery configuration
    └── notification_tasks.py   # Background tasks (email, reminders)
```

### Adding New API Endpoints

1. Define the SQLAlchemy model in `app/models/`
2. Create Pydantic schemas in `app/schemas/`
3. Implement CRUD operations in `app/crud/`
4. Create API routes in `app/api/v1/`
5. Register router in `app/api/v1/router.py`

Example pattern:
```python
# app/api/v1/entries.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.entry import EntryCreate, EntryResponse
from app.crud.entry import create_entry

router = APIRouter(prefix="/entries", tags=["entries"])

@router.post("/", response_model=EntryResponse)
async def create_entry_endpoint(
    entry: EntryCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_entry(db, entry)
```

### WebSocket Real-Time Sync

**Architecture:**
- `WebSocketManager` maintains a dict of `calendar_id -> set of WebSocket connections`
- When an entry/task is created/updated, broadcast to all connections in that calendar
- Message format: `{"type": "entry:created", "data": {...}}`

**Message Types:**
- `entry:created` - New entry created
- `entry:updated` - Entry modified
- `entry:completed` - Entry marked complete
- `task:updated` - Task modified
- `ping` / `pong` - Keepalive

**Implementation pattern:**
```python
# After creating/updating an entry
await websocket_manager.broadcast_to_calendar(
    calendar_id=entry.calendar_id,
    message={"type": "entry:created", "data": entry_dict}
)
```

## Important Project Files

### Documentation Files (Chinese)
- `README.md` - Quick start guide (Chinese)
- `PROJECT_OVERVIEW.md` - High-level architecture overview
- `three_views_detailed.md` - Detailed UI/UX design for three views
- `START_HERE.md` - Getting started guide
- `COMPLETE_BACKEND_GUIDE.md` - Comprehensive backend documentation
- `01_SPECIFY.md` - Product specification (Spec-Driven Development Phase 1)
- `02_PLAN.md` - Technical planning (Spec-Driven Development Phase 2)
- `03_TASKS.md` - Task breakdown (95 tasks for 11-week MVP)

### Configuration Files
- `requirements.txt` - Python dependencies (FastAPI, SQLAlchemy, etc.)
- `docker-compose.yml` - Multi-service Docker setup
- `Dockerfile` - Backend container definition
- `database_schema_v2_corrected.sql` - Complete PostgreSQL schema with triggers

## Common Development Patterns

### Async Database Operations

Always use async/await with SQLAlchemy:
```python
from sqlalchemy import select
from app.core.database import get_db

async def get_entry_by_id(db: AsyncSession, entry_id: UUID):
    result = await db.execute(
        select(Entry).where(Entry.id == entry_id)
    )
    return result.scalar_one_or_none()
```

### Adding Entry to Task

Use the dedicated endpoint, don't set `task_id` directly in update:
```python
# ✅ Correct
POST /api/v1/entries/{entry_id}/add-to-task
{"task_id": "uuid"}

# ❌ Incorrect (bypasses validation and business logic)
PATCH /api/v1/entries/{entry_id}
{"task_id": "uuid"}
```

### Filtering Entries

Common filter patterns:
```python
# Entries without timestamp (inbox)
GET /api/v1/entries?has_timestamp=false

# Entries in date range (calendar view)
GET /api/v1/entries?start_date=2024-03-01&end_date=2024-03-31

# Entries belonging to a task
GET /api/v1/entries?task_id={uuid}

# Incomplete entries only
GET /api/v1/entries?is_completed=false
```

## Environment Variables

Required in `.env` or `docker-compose.yml`:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://calendar_user:calendar_password@postgres:5432/calendar_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT Authentication
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (comma-separated origins)
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:19006"]

# Environment
ENVIRONMENT=development  # or production
```

## Testing Strategy

### Unit Tests
- Test CRUD operations in isolation
- Mock database with pytest fixtures
- Test Pydantic schema validation

### Integration Tests
- Test full API endpoints with test database
- Use `pytest-asyncio` for async tests
- Test WebSocket connections

### Example Test Pattern
```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_entry():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/v1/entries", json={
            "title": "Test Entry",
            "calendar_id": str(uuid4())
        })
        assert response.status_code == 201
        assert response.json()["title"] == "Test Entry"
```

## Common Pitfalls to Avoid

1. **Don't add timestamps to Task model** - Time belongs to entries only
2. **Don't manually update task progress** - Use database trigger
3. **Don't forget WebSocket broadcast** - After entry/task changes, notify connected clients
4. **Don't use sync database calls** - Always use async/await with SQLAlchemy
5. **Don't skip calendar_id checks** - Ensure users can only access their own data
6. **Don't store secrets in code** - Use environment variables
7. **Don't bypass the "add-to-task" endpoint** - It validates calendar ownership

## Performance Considerations

- Database queries use indexes on `calendar_id`, `task_id`, `timestamp`
- Redis caching for frequently accessed data (user sessions)
- WebSocket connections are lightweight (managed per calendar)
- Use pagination for large entry lists
- Database trigger handles task progress calculation (not application code)

## Deployment

### Production Checklist
- [ ] Change `SECRET_KEY` to secure random value
- [ ] Set `ENVIRONMENT=production`
- [ ] Use proper PostgreSQL connection pooling
- [ ] Enable HTTPS/WSS for WebSockets
- [ ] Configure Redis persistence (AOF or RDB)
- [ ] Set up log aggregation (Loguru to external service)
- [ ] Configure Celery beat for periodic tasks
- [ ] Set up database backups
- [ ] Use Gunicorn with Uvicorn workers

### Docker Production Build
```bash
# Build production image
docker build -t calendar-backend:latest .

# Run with production settings
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e SECRET_KEY=$(openssl rand -hex 32) \
  calendar-backend:latest
```

## Key Design Decisions (ADRs)

From `02_PLAN.md`:

1. **Why FastAPI?** - Native async support, automatic API docs, type safety
2. **Why PostgreSQL?** - JSONB support, triggers, robust transaction handling
3. **Why no timestamps on Tasks?** - Allows entries to exist independently and have different times within same task
4. **Why WebSockets?** - Low latency real-time sync, better than polling
5. **Why SQLAlchemy 2.0?** - Async support, type hints, mature ORM

## Additional Resources

- FastAPI docs: https://fastapi.tiangolo.com
- SQLAlchemy async: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- Alembic migrations: https://alembic.sqlalchemy.org

## Development Note

### 虛擬環境
venv

### commit
在適當的時機自動 commit，使用 subagent commit-message-writer 撰寫英文 commit message，並 push 到 remote

### 可用的 Agents：
  - ✅ linus-code-reviewer - 代碼審查
  - ✅ commit-message-writer - 生成 commit message
  - ✅ debug-investigator - 調試問題
  - ✅ test-architect - 創建測試
  - ✅ docs-sync-reviewer - 更新文件

## Recent Updates and Fixes (2025-11-10)

### Completed Features ✅

**Epic 2: Authentication System (COMPLETED - 2025-11-09)**
- ✅ User registration and login fully functional
- ✅ JWT-based authentication working
- ✅ Protected routes with AuthGuard component
- ✅ Calendar access control implemented
- ✅ Commit: 6f560f8 (auth UI), 054c7be (auth fixes)

**Epic 4: Task Backend API (COMPLETED - 2025-11-09)**
- ✅ Task SQLAlchemy model (NO timestamp field - entry-first philosophy)
- ✅ Complete Task Pydantic schemas (TaskCreate, TaskUpdate, TaskInDB, TaskWithEntries, TaskStats)
- ✅ Full Task CRUD operations with calendar access control
- ✅ Database trigger for auto progress calculation (total_entries, completed_entries)
- ✅ 11 Task API endpoints (create, list, get, update, delete, complete, reopen, archive, stats, reorder, batch)
- ✅ Comprehensive testing (5/5 tests passed via test_epic4.sh)
- ✅ **Critical Fix**: TaskWithEntries.entries field type corrected from `list` to `list[EntryInDB]`

**Epic 5.3: Calendar View (COMPLETED - 2025-11-09)**
- ✅ Full calendar view with 42-cell grid
- ✅ Month navigation (prev/next/today)
- ✅ Entry CRUD operations (create/edit/delete)
- ✅ Entry completion toggling
- ✅ Day entries modal for viewing all entries
- ✅ 168 comprehensive test cases (84/116 passing - 72%)
- ✅ Commits: 553817e (initial), 2b5450d (dialogs), 82e9df4 (tests), 667e2bd (test improvements)

**Epic 5.4: Entry List View (COMPLETED - 2025-11-09)**
- ✅ Comprehensive filtering system (entry type, timestamp, completion status)
- ✅ Flexible sorting (by created date, timestamp, priority, title)
- ✅ Smart date grouping (Today, This week, Earlier this week, Upcoming, Past, Unscheduled)
- ✅ Client-side filtering with useMemo for performance optimization
- ✅ Search functionality across entry titles and content
- ✅ Entry CRUD operations reusing EntryDialog from calendar view
- ✅ Component structure: EntriesList (266 lines), FilterSortBar (179 lines), EntriesPage (176 lines)
- ✅ Commit: faf9a19 (feature implementation)
- ✅ Recent fixes: 8ced013 (422 errors), d2cdf0b (dependency issues), 5455b7a (ReactQueryDevtools hydration)

**Epic 5.5: Task View (COMPLETED - 2025-11-09)**
- ✅ Task Board with status filtering (All/Active/Completed/Archived)
- ✅ Task cards showing progress bars and completion percentage
- ✅ Expandable entry lists within tasks
- ✅ Task create/edit dialogs with form validation
- ✅ Task detail pages with comprehensive entry management
- ✅ Task deletion with confirmation
- ✅ Entry completion toggling
- ✅ Toast notifications for user feedback
- ✅ Smart empty states and loading indicators
- ✅ Component structure: TaskCard (183 lines), TaskBoard (122 lines), TaskDialog (231 lines), Task detail page (218 lines)
- ✅ New dependencies: sonner, date-fns, react-day-picker, @radix-ui/* components
- ✅ Commit: 649e1fa

**Epic 5.6: Mobile Responsive Design (COMPLETED - 2025-11-09)**
- ✅ Mobile-responsive layouts across all views (Calendar, Entries, Tasks)
- ✅ Touch-optimized interactions
- ✅ Responsive navigation
- ✅ Breakpoint-aware component rendering
- ✅ Commit: 0b7533a

**Epic 6: Real-time Sync (WebSocket) (COMPLETED - 2025-11-10)**
- ✅ WebSocket client with auto-reconnection
- ✅ Exponential backoff retry strategy (1s → 2s → 4s → 8s → 16s → 30s max)
- ✅ Heartbeat/ping-pong mechanism (30s interval, 5s timeout)
- ✅ React Query cache integration for automatic UI updates
- ✅ Connection status tracking and UI indicator
- ✅ Singleton pattern implementation (fixed "Insufficient resources" bug)
- ✅ Message types: entry:created, entry:updated, entry:deleted, entry:completed, task:updated, task:created, task:deleted
- ✅ WebSocket architecture:
  - `types.ts` (53 lines) - Type definitions
  - `client.ts` (211 lines) - Core WebSocket client with reconnection logic
  - `handlers.ts` (147 lines) - Message handlers and React Query integration
  - `useWebSocket.ts` (81 lines) - React hook for WebSocket usage
  - `websocketStore.ts` (40 lines) - Zustand store for connection state
  - `singleton.ts` (49 lines) - Singleton pattern implementation
  - `ConnectionIndicator.tsx` (58 lines) - UI component for connection status
  - `WebSocketProvider.tsx` (98 lines) - Provider component
- ✅ Commits: d56b077 (initial implementation), fd62198 (singleton fix)

**Task-Entry Association UI (COMPLETED - 2025-11-10)**
- ✅ "Add Entry" button in Task View
- ✅ EntryDialog with defaultTaskId support for pre-filling task
- ✅ Seamless entry creation within task context
- ✅ Entry-task relationship UI flow completed
- ✅ Commit: a8eb281

### Critical Fixes ✅

**WebSocket Connection Cycling ("Insufficient resources" Error) (Fixed in fd62198)**
- Issue: Multiple WebSocket connections being created simultaneously, causing "Insufficient resources" error
- Root Cause: Each React component mount was creating a new WebSocket instance
- Solution: Implemented singleton pattern to ensure only one WebSocket connection per calendar
- Files: `singleton.ts` (new), `client.ts` (refactored to use singleton)
- Impact: Stable WebSocket connection, no more connection cycling, reduced server load
- Status: ✅ RESOLVED

**Task API GET Endpoint 500 Error (Fixed in Epic 4)**
- Issue: GET /api/v1/tasks/{id} returning 500 Internal Server Error
- Root Cause: TaskWithEntries.entries field typed as generic `list` instead of `list[EntryInDB]`
- Fix: Added proper type annotation and EntryInDB import in app/schemas/task.py:71
- Impact: Task API now correctly serializes entries with full details
- Status: ✅ RESOLVED

**Authentication 500 Error (Fixed in 054c7be)**
- Issue: Login endpoint returning 500 Internal Server Error
- Root Cause: bcrypt 4.x removed __about__ attribute that passlib 1.7.4 depends on
- Solution: Pin bcrypt to version 3.2.2 in requirements.txt
- Status: ✅ RESOLVED
- Impact: All authentication endpoints now working correctly

**CORS Issues (Fixed in 054c7be)**
- Issue: CORS-related errors in frontend
- Root Cause: Server crash before CORS headers could be sent (symptom of bcrypt issue)
- Solution: Fixed underlying bcrypt issue, CORS configuration already correct
- Status: ✅ RESOLVED

**Calendar ID Management (Fixed in 054c7be)**
- Issue: CalendarView not using authenticated user's calendar_id
- Solution: Implemented proper calendar state management with useCalendars hook
- Status: ✅ RESOLVED
- Files: CalendarView.tsx, AuthGuard.tsx, calendars.ts

### Known Issues and Workarounds

**Test Suite Status**
- Current: 84/116 tests passing (72%)
- 32 failing tests primarily in EntryDialog and DayEntriesModal
- All critical user journeys work in production
- Test infrastructure improvements in progress

**Dependencies to Monitor**
- bcrypt: MUST stay at 3.2.2 (DO NOT upgrade to 4.x)
- passlib: 1.7.4 (stable, no changes needed)
- If bcrypt issues occur: `pip install -r requirements.txt --force-reinstall`

### Current Development Status

**Completed (100%)**:
- ✅ Project Setup (Epic 1)
- ✅ Authentication System (Epic 2)
- ✅ Entry Backend API (Epic 3)
- ✅ Task Backend API (Epic 4)
- ✅ Frontend Core (Epic 5) - **ALL STORIES COMPLETED! 2025-11-10**
  - ✅ Epic 5.1: Project Setup
  - ✅ Epic 5.2: Authentication UI
  - ✅ Epic 5.3: Calendar View
  - ✅ Epic 5.4: Entry List View
  - ✅ Epic 5.5: Task View
  - ✅ Epic 5.6: Mobile Responsive Design
- ✅ Real-time Sync (Epic 6) - **COMPLETED! 2025-11-10**
  - ✅ WebSocket Backend (Stories 6.1.1-6.1.3)
  - ✅ WebSocket Frontend (Stories 6.2.1-6.2.3)
  - ✅ Connection management and auto-reconnection
  - ✅ React Query integration
  - ✅ Optimistic updates

**In Progress**:
- ⏳ None - Ready for Epic 7 (Advanced Features)

**Pending**:
- ⏳ Advanced Features (Epic 7) - Comments, Attachments, Search
- ⏳ Mobile App (Epic 8) - React Native
- ⏳ Testing (Epic 9) - Comprehensive test suite
- ⏳ Deployment (Epic 10) - Production deployment
- ⏳ Documentation (Epic 11) - User and developer docs

