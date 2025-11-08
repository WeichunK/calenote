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
- API Documentation: http://localhost:8000/api/docs
- PgAdmin: http://localhost:5050 (admin@calendar.com / admin)
- Flower (Celery monitoring): http://localhost:5555

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

### Key Files Currently in Root

The following Python files are currently in the repository root (should eventually be moved to proper `app/` structure):
- `main.py` - FastAPI application setup
- `entry.py` - Entry model
- `task.py` - Task model
- `entries.py` - Entry API routes
- `websocket.py` - WebSocket routes
- `websocket_manager.py` - WebSocket connection manager

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

