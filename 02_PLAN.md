# Phase 2: PLAN
# Calendar + Task Management System - Technical Implementation Plan

**Version:** 1.0  
**Last Updated:** 2025-11-08  
**Status:** Ready for Tasks Phase  
**Based on:** SPECIFY.md v1.0

---

## 📋 Plan Overview

This document translates the product specification into a concrete technical implementation plan. It defines the technology stack, architecture, data models, API design, and development approach.

**Key Decisions:**
- Backend: Python 3.11+ with FastAPI
- Frontend: React (Web) + React Native (Mobile)
- Database: PostgreSQL 15
- Real-time: WebSocket + Redis
- Deployment: Docker containers

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├──────────────────────────┬──────────────────────────────────┤
│   Web App (React)        │   Mobile App (React Native)      │
│   - Next.js 14           │   - Expo 50                      │
│   - Zustand (state)      │   - Zustand (state)              │
│   - TanStack Query       │   - TanStack Query               │
│   - Socket.io-client     │   - Socket.io-client             │
└──────────────────────────┴──────────────────────────────────┘
                           │
                           │ HTTPS / WSS
                           │
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                        │
│   Nginx (Reverse Proxy + Load Balancer)                     │
│   - SSL Termination                                          │
│   - Rate Limiting                                            │
│   - Request Routing                                          │
└─────────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
┌───────────────▼──────────┐ ┌───────▼────────────────────────┐
│   APPLICATION LAYER      │ │   REAL-TIME LAYER              │
│   FastAPI (Python 3.11)  │ │   FastAPI WebSocket            │
│   - REST API             │ │   - Socket.io Server           │
│   - Business Logic       │ │   - Connection Manager         │
│   - Authentication       │ │   - Event Broadcasting         │
│   - Data Validation      │ │                                │
└──────────────────────────┘ └────────────────────────────────┘
           │                              │
           │                              │
           ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├──────────────────────────┬──────────────────────────────────┤
│   PostgreSQL 15          │   Redis 7                        │
│   - Entries              │   - Session Store                │
│   - Tasks                │   - WebSocket State              │
│   - Users                │   - Cache Layer                  │
│   - Calendars            │   - Rate Limit Counters          │
│   - Comments             │                                  │
│   - Attachments          │                                  │
└──────────────────────────┴──────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                             │
│   AWS S3 / Local FileSystem                                 │
│   - File Attachments                                         │
│   - User Avatars                                             │
│   - Backups                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Technology Stack

### Backend Stack

**Core Framework: FastAPI 0.104+**
- **Why:** Native async support, automatic OpenAPI docs, excellent WebSocket support
- **Alternatives considered:** Django (too heavy), Flask (lacks async), Node.js (team expertise)

**Language: Python 3.11+**
- **Why:** Type hints, performance improvements, team expertise
- **Version requirement:** 3.11+ for improved error messages and async performance

**ORM: SQLAlchemy 2.0+**
- **Why:** Mature, supports async, flexible querying
- **Migration tool:** Alembic

**Database: PostgreSQL 15**
- **Why:** JSONB support, array fields, excellent performance, ACID compliance
- **Alternatives considered:** MySQL (less flexible types), MongoDB (need ACID)

**Cache/Queue: Redis 7**
- **Why:** Fast, reliable, supports pub/sub for WebSocket
- **Usage:** Session store, WebSocket state, rate limiting, cache

**Background Tasks: Celery 5.3+**
- **Why:** Mature, reliable, good monitoring tools
- **Broker:** Redis
- **Usage:** Notifications, reminders, data exports

---

### Frontend Stack

**Web Framework: React 18 + Next.js 14**
- **Why:** SSR/SSG support, excellent DX, large ecosystem
- **Rendering:** Hybrid (SSR for initial load, CSR for interactions)
- **Deployment:** Vercel or self-hosted

**Mobile Framework: React Native 0.72+ (Expo 50)**
- **Why:** Code sharing with web, faster development, OTA updates
- **Alternatives considered:** Flutter (different language), Native (2x effort)

**State Management: Zustand 4.4+**
- **Why:** Lightweight, simple API, TypeScript support, no boilerplate
- **Alternatives considered:** Redux (too verbose), MobX (less common)

**Data Fetching: TanStack Query (React Query) 5+**
- **Why:** Caching, optimistic updates, automatic refetching
- **Usage:** All API calls, WebSocket integration

**Real-time: Socket.io-client 4.6+**
- **Why:** Automatic reconnection, room support, fallback to polling
- **Backend:** Native FastAPI WebSocket with Socket.io adapter

**UI Components:**
- **Web:** Radix UI (unstyled) + Tailwind CSS
- **Mobile:** React Native Paper
- **Icons:** Lucide React (web), React Native Vector Icons (mobile)

**Forms:** React Hook Form + Zod validation
**Date/Time:** date-fns (lighter than moment.js)
**Drag-and-Drop:** dnd-kit (web), react-native-gesture-handler (mobile)

---

## 🗄️ Database Design

### Core Principles

1. **Entry-Centric:** Entries table is the heart of the system
2. **Optional Relationships:** Foreign keys are nullable where relationships are optional
3. **Denormalization:** Store computed values (task progress) for performance
4. **Soft Deletes:** Keep deleted_at for auditing (implement if needed)
5. **Timestamps:** All tables have created_at, updated_at

---

### Schema Design

```sql
-- ============================================
-- Users & Authentication
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- Calendars (Workspaces)
-- ============================================

CREATE TABLE calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#4285F4',
    icon VARCHAR(50),
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendars_created_by ON calendars(created_by);

-- ============================================
-- Calendar Membership
-- ============================================

CREATE TABLE calendar_members (
    calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_settings JSONB DEFAULT '{"push": true, "email": true}',
    PRIMARY KEY (calendar_id, user_id)
);

CREATE INDEX idx_calendar_members_user ON calendar_members(user_id);

-- ============================================
-- CORE TABLE: Entries
-- ============================================

CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    
    -- Basic Info
    title VARCHAR(500) NOT NULL,
    content TEXT,
    
    -- Type & State
    entry_type VARCHAR(20) DEFAULT 'note' CHECK (entry_type IN ('note', 'task', 'event')),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    
    -- Timestamp (CORE: entries own time)
    timestamp TIMESTAMP,  -- NULL = unscheduled
    end_timestamp TIMESTAMP,
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Task Relationship (optional)
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    position_in_task INTEGER,  -- For ordering within task
    
    -- Organization
    color VARCHAR(7),
    tags TEXT[],
    priority INTEGER DEFAULT 0 CHECK (priority BETWEEN 0 AND 3),
    
    -- Recurrence
    recurrence_rule TEXT,  -- iCal RRULE format
    recurrence_end_date DATE,
    parent_entry_id UUID REFERENCES entries(id),  -- For recurring instances
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_timestamp IS NULL OR end_timestamp >= timestamp)
);

-- Indexes for performance
CREATE INDEX idx_entries_calendar ON entries(calendar_id);
CREATE INDEX idx_entries_timestamp ON entries(timestamp) WHERE timestamp IS NOT NULL;
CREATE INDEX idx_entries_unscheduled ON entries(calendar_id, created_at) WHERE timestamp IS NULL;
CREATE INDEX idx_entries_task ON entries(task_id, position_in_task) WHERE task_id IS NOT NULL;
CREATE INDEX idx_entries_created_by ON entries(created_by);
CREATE INDEX idx_entries_completed ON entries(is_completed, calendar_id);
CREATE INDEX idx_entries_tags ON entries USING gin(tags);

-- ============================================
-- CORE TABLE: Tasks
-- ============================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    
    -- Basic Info
    title VARCHAR(300) NOT NULL,
    description TEXT,
    
    -- NO TIMESTAMP! Time comes from entries
    -- Optional: Soft deadline for reminders
    due_date DATE,
    
    -- State
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'cancelled')),
    completed_at TIMESTAMP,
    
    -- Progress (auto-updated by triggers)
    total_entries INTEGER DEFAULT 0,
    completed_entries INTEGER DEFAULT 0,
    completion_percentage INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN total_entries = 0 THEN 0
            ELSE (completed_entries * 100 / total_entries)
        END
    ) STORED,
    
    -- Visual
    color VARCHAR(7),
    icon VARCHAR(50),
    
    -- Ordering
    position INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_calendar ON tasks(calendar_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_position ON tasks(calendar_id, position);

-- ============================================
-- Comments
-- ============================================

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    mentions UUID[],  -- Array of user IDs mentioned
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP  -- Soft delete
);

CREATE INDEX idx_comments_entry ON comments(entry_id, created_at);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- ============================================
-- Attachments
-- ============================================

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    
    file_name VARCHAR(500) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    thumbnail_url TEXT,
    
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_entry ON attachments(entry_id);

-- ============================================
-- Notifications
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES users(id),
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);

-- ============================================
-- Activity Logs (Audit Trail)
-- ============================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE,
    
    entity_type VARCHAR(50) NOT NULL,  -- 'entry', 'task', 'comment'
    entity_id UUID,
    action_type VARCHAR(50) NOT NULL,  -- 'created', 'updated', 'deleted', 'completed'
    
    changes JSONB,  -- Before/after values
    
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_activity_logs_calendar ON activity_logs(calendar_id, performed_at);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- ============================================
-- Triggers: Auto-update Task Progress
-- ============================================

CREATE OR REPLACE FUNCTION update_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.task_id IS NOT NULL) OR (TG_OP = 'INSERT' AND NEW.task_id IS NOT NULL) THEN
        UPDATE tasks
        SET 
            total_entries = (
                SELECT COUNT(*) 
                FROM entries 
                WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
            ),
            completed_entries = (
                SELECT COUNT(*) 
                FROM entries 
                WHERE task_id = COALESCE(NEW.task_id, OLD.task_id) 
                AND is_completed = true
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = COALESCE(NEW.task_id, OLD.task_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_completion
AFTER INSERT OR UPDATE OF is_completed, task_id ON entries
FOR EACH ROW
EXECUTE FUNCTION update_task_completion();

-- ============================================
-- Views for Common Queries
-- ============================================

-- Calendar View: All scheduled entries
CREATE VIEW calendar_entries AS
SELECT 
    e.*,
    t.title as task_title,
    t.color as task_color,
    COUNT(DISTINCT a.id) as attachment_count,
    COUNT(DISTINCT c.id) as comment_count
FROM entries e
LEFT JOIN tasks t ON e.task_id = t.id
LEFT JOIN attachments a ON e.id = a.entry_id
LEFT JOIN comments c ON e.id = c.entry_id
WHERE e.timestamp IS NOT NULL
GROUP BY e.id, t.id;

-- Unscheduled Entries
CREATE VIEW unscheduled_entries AS
SELECT 
    e.*,
    COUNT(DISTINCT a.id) as attachment_count,
    COUNT(DISTINCT c.id) as comment_count
FROM entries e
LEFT JOIN attachments a ON e.id = a.entry_id
LEFT JOIN comments c ON e.id = c.entry_id
WHERE e.timestamp IS NULL AND e.task_id IS NULL
GROUP BY e.id;

-- Task Summary
CREATE VIEW task_summaries AS
SELECT 
    t.*,
    MIN(e.timestamp) as earliest_entry,
    MAX(e.timestamp) as latest_entry,
    COUNT(e.id) FILTER (WHERE e.timestamp IS NOT NULL) as scheduled_entries
FROM tasks t
LEFT JOIN entries e ON t.id = e.task_id
GROUP BY t.id;
```

---

## 🔌 API Design

### REST API Structure

**Base URL:** `https://api.app.com/v1`

**Authentication:** JWT Bearer Token in Authorization header

---

### API Endpoints

#### Authentication

```
POST   /auth/register          Register new user
POST   /auth/login             Login and get JWT
POST   /auth/refresh           Refresh JWT token
POST   /auth/logout            Invalidate token
GET    /auth/me                Get current user info
```

---

#### Calendars

```
GET    /calendars              List user's calendars
POST   /calendars              Create new calendar
GET    /calendars/:id          Get calendar details
PATCH  /calendars/:id          Update calendar
DELETE /calendars/:id          Delete calendar

GET    /calendars/:id/members  List members
POST   /calendars/:id/members  Add member
DELETE /calendars/:id/members/:userId  Remove member
```

---

#### Entries (Core)

```
GET    /entries                List entries (with filters)
  Query params:
    - calendar_id (required)
    - has_timestamp (bool): filter scheduled/unscheduled
    - task_id (uuid): filter by task
    - entry_type (note|task|event)
    - is_completed (bool)
    - tags (array)
    - start_date, end_date (ISO 8601)
    - search (text search)
    - sort_by (created_at|timestamp|title|priority)
    - order (asc|desc)
    - skip, limit (pagination)

POST   /entries                Create entry
GET    /entries/:id            Get entry details
PATCH  /entries/:id            Update entry
DELETE /entries/:id            Delete entry

POST   /entries/:id/complete   Toggle completion
POST   /entries/:id/add-to-task    Add to task
POST   /entries/:id/remove-from-task  Remove from task

POST   /entries/batch/update   Bulk update
POST   /entries/batch/delete   Bulk delete
POST   /entries/batch/add-to-task  Bulk add to task
```

**Example Request:**
```json
POST /v1/entries
{
  "title": "Team meeting",
  "content": "Discuss Q2 plans",
  "entry_type": "event",
  "timestamp": "2024-03-15T14:00:00Z",
  "end_timestamp": "2024-03-15T15:00:00Z",
  "calendar_id": "uuid",
  "tags": ["work", "important"],
  "priority": 2
}
```

**Example Response:**
```json
{
  "id": "uuid",
  "title": "Team meeting",
  "entry_type": "event",
  "timestamp": "2024-03-15T14:00:00Z",
  "is_completed": false,
  "task_id": null,
  "created_at": "2024-03-10T10:00:00Z",
  "updated_at": "2024-03-10T10:00:00Z"
}
```

---

#### Tasks

```
GET    /tasks                  List tasks
  Query params:
    - calendar_id (required)
    - status (active|completed|archived)
    - sort_by (created_at|due_date|completion_percentage)
    - order (asc|desc)

POST   /tasks                  Create task
GET    /tasks/:id              Get task with entries
PATCH  /tasks/:id              Update task
DELETE /tasks/:id              Delete task

POST   /tasks/:id/reorder      Reorder entries in task
POST   /tasks/:id/archive      Archive completed task
```

**Example Response (GET /tasks/:id):**
```json
{
  "id": "uuid",
  "title": "Q2 Product Launch",
  "description": "...",
  "status": "active",
  "due_date": "2024-06-30",
  "completion_percentage": 60,
  "total_entries": 5,
  "completed_entries": 3,
  "entries": [
    {
      "id": "uuid",
      "title": "Market research",
      "is_completed": true,
      "timestamp": "2024-03-10T10:00:00Z"
    },
    {
      "id": "uuid",
      "title": "Design mockups",
      "is_completed": true,
      "timestamp": null
    },
    {
      "id": "uuid",
      "title": "Development",
      "is_completed": false,
      "timestamp": "2024-04-01T09:00:00Z"
    }
  ],
  "created_at": "2024-03-01T00:00:00Z"
}
```

---

#### Comments

```
GET    /entries/:id/comments   List comments
POST   /entries/:id/comments   Add comment
PATCH  /comments/:id           Edit comment
DELETE /comments/:id           Delete comment
```

---

#### Attachments

```
GET    /entries/:id/attachments   List attachments
POST   /entries/:id/attachments   Upload attachment
DELETE /attachments/:id           Delete attachment

POST   /upload                    Pre-signed URL for direct upload
```

---

#### Search

```
GET    /search                 Global search
  Query params:
    - q (query string)
    - calendar_id
    - types (entry|task|comment)
```

---

### WebSocket API

**Connection:** `wss://api.app.com/ws/calendar/:calendarId?token=JWT`

**Events Sent by Client:**
```javascript
{
  "type": "ping",  // Heartbeat
}

{
  "type": "typing",  // User is typing
  "entry_id": "uuid"
}
```

**Events Sent by Server:**
```javascript
// Entry events
{
  "type": "entry:created",
  "data": { /* entry object */ }
}

{
  "type": "entry:updated",
  "data": {
    "id": "uuid",
    "changes": { /* updated fields */ }
  }
}

{
  "type": "entry:deleted",
  "data": { "id": "uuid" }
}

{
  "type": "entry:completed",
  "data": {
    "id": "uuid",
    "is_completed": true,
    "completed_by": "user_id"
  }
}

// Task events
{
  "type": "task:updated",
  "data": { /* task object */ }
}

// Presence events
{
  "type": "user:connected",
  "data": {
    "user_id": "uuid",
    "subscribers": 3
  }
}

{
  "type": "user:typing",
  "data": {
    "user_id": "uuid",
    "entry_id": "uuid"
  }
}
```

---

## 🎨 Frontend Architecture

### Shared Code Structure

```
packages/
├── shared/                    # Shared between web and mobile
│   ├── api/
│   │   ├── client.ts         # Axios/fetch client
│   │   ├── entries.ts        # Entry API calls
│   │   ├── tasks.ts          # Task API calls
│   │   └── websocket.ts      # WebSocket manager
│   ├── hooks/
│   │   ├── useEntries.ts
│   │   ├── useTasks.ts
│   │   ├── useCalendar.ts
│   │   └── useRealtime.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── entriesStore.ts
│   │   ├── tasksStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── entry.ts
│   │   ├── task.ts
│   │   └── api.ts
│   └── utils/
│       ├── date.ts
│       ├── validation.ts
│       └── formatting.ts
│
├── web/                       # Next.js web app
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── calendar/
│   │   │   ├── entries/
│   │   │   └── tasks/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── DayGrid.tsx
│   │   │   ├── WeekGrid.tsx
│   │   │   └── MonthGrid.tsx
│   │   ├── entries/
│   │   │   ├── EntryList.tsx
│   │   │   ├── EntryCard.tsx
│   │   │   └── EntryEditor.tsx
│   │   ├── tasks/
│   │   │   ├── TaskBoard.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskDetail.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── ViewSwitcher.tsx
│   └── styles/
│
└── mobile/                    # React Native app
    ├── App.tsx
    ├── screens/
    │   ├── CalendarScreen.tsx
    │   ├── EntriesScreen.tsx
    │   └── TasksScreen.tsx
    ├── components/
    │   ├── calendar/
    │   ├── entries/
    │   └── tasks/
    └── navigation/
        └── RootNavigator.tsx
```

---

### State Management Strategy

**Zustand Stores:**

```typescript
// entriesStore.ts
interface EntriesStore {
  entries: Entry[];
  selectedEntry: Entry | null;
  filters: EntryFilters;
  
  // Actions
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  setFilters: (filters: EntryFilters) => void;
  toggleComplete: (id: string) => void;
}

// tasksStore.ts
interface TasksStore {
  tasks: Task[];
  selectedTask: Task | null;
  
  // Actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addEntryToTask: (entryId: string, taskId: string) => void;
  removeEntryFromTask: (entryId: string) => void;
}

// uiStore.ts
interface UIStore {
  currentView: 'calendar' | 'entries' | 'tasks';
  calendarViewMode: 'month' | 'week' | 'day';
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  
  // Actions
  setView: (view: UIStore['currentView']) => void;
  setCalendarViewMode: (mode: UIStore['calendarViewMode']) => void;
  toggleSidebar: () => void;
}
```

**React Query for Server State:**

```typescript
// Custom hooks using TanStack Query
function useEntries(calendarId: string, filters: EntryFilters) {
  return useQuery({
    queryKey: ['entries', calendarId, filters],
    queryFn: () => entriesApi.list(calendarId, filters),
    staleTime: 1000 * 60, // 1 minute
  });
}

function useCreateEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: entriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
    // Optimistic update
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ['entries'] });
      
      const previousEntries = queryClient.getQueryData(['entries']);
      
      queryClient.setQueryData(['entries'], (old) => [...old, newEntry]);
      
      return { previousEntries };
    },
    onError: (err, newEntry, context) => {
      queryClient.setQueryData(['entries'], context.previousEntries);
    },
  });
}
```

---

### WebSocket Integration

```typescript
// websocket.ts
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(calendarId: string, token: string) {
    this.ws = new WebSocket(
      `wss://api.app.com/ws/calendar/${calendarId}?token=${token}`
    );
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      this.attemptReconnect(calendarId, token);
    };
  }
  
  private handleMessage(message: WSMessage) {
    const { type, data } = message;
    
    switch (type) {
      case 'entry:created':
        entriesStore.getState().addEntry(data);
        break;
      
      case 'entry:updated':
        entriesStore.getState().updateEntry(data.id, data.changes);
        break;
      
      case 'entry:deleted':
        entriesStore.getState().deleteEntry(data.id);
        break;
      
      case 'task:updated':
        tasksStore.getState().updateTask(data.id, data);
        break;
    }
  }
  
  private startHeartbeat() {
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
  }
  
  send(message: WSMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  disconnect() {
    this.ws?.close();
  }
}

export const wsManager = new WebSocketManager();
```

---

## 🚀 Deployment Strategy

### Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: calendar_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    command: uvicorn app.main:app --reload --host 0.0.0.0
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://dev:dev@postgres:5432/calendar_dev
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  web:
    build: ./packages/web
    command: npm run dev
    volumes:
      - ./packages/web:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Production Environment

**Infrastructure:**
- **Hosting:** AWS / DigitalOcean / Vercel
- **Containers:** Docker + Docker Compose / Kubernetes
- **Database:** Managed PostgreSQL (AWS RDS / DigitalOcean Managed DB)
- **Cache:** Managed Redis
- **CDN:** CloudFlare
- **File Storage:** AWS S3
- **Monitoring:** Sentry (errors) + Prometheus + Grafana (metrics)

**Deployment Pipeline:**
```
GitHub → GitHub Actions → Docker Build → Push to Registry → Deploy
```

---

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run backend tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest
      
      - name: Run frontend tests
        run: |
          cd packages/web
          npm install
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build and push Docker images
        run: |
          docker build -t calendar-backend ./backend
          docker push registry/calendar-backend:latest
      
      - name: Deploy to production
        run: |
          # SSH to server and pull latest images
          # Or deploy to Kubernetes
```

---

## 🔒 Security Considerations

### Authentication

**JWT Strategy:**
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry, stored in httpOnly cookie
- Token rotation on refresh

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 number
- Bcrypt hashing (cost factor 12)

---

### Authorization

**Role-Based Access Control (RBAC):**

```python
class Permission(Enum):
    VIEW = "view"
    CREATE = "create"
    EDIT = "edit"
    DELETE = "delete"
    MANAGE_MEMBERS = "manage_members"

ROLE_PERMISSIONS = {
    "viewer": [Permission.VIEW],
    "editor": [Permission.VIEW, Permission.CREATE, Permission.EDIT],
    "admin": [Permission.VIEW, Permission.CREATE, Permission.EDIT, Permission.DELETE],
    "owner": [Permission.VIEW, Permission.CREATE, Permission.EDIT, Permission.DELETE, Permission.MANAGE_MEMBERS]
}
```

---

### API Security

- **Rate Limiting:** 100 requests/minute per user
- **CORS:** Whitelist frontend domains only
- **Input Validation:** Pydantic schemas for all inputs
- **SQL Injection:** ORM parameterized queries
- **XSS Protection:** Sanitize all user input
- **CSRF Protection:** SameSite cookies + CSRF tokens

---

## 📊 Performance Requirements

### Response Times

- **API Endpoints:** < 200ms (p95)
- **Database Queries:** < 100ms (p95)
- **WebSocket Latency:** < 500ms
- **Page Load:** < 2s (initial), < 500ms (subsequent)

### Scalability Targets

- **Concurrent Users:** 10,000+
- **Entries per User:** 10,000+
- **API Throughput:** 1,000 req/sec
- **WebSocket Connections:** 5,000 concurrent

### Optimization Strategies

**Database:**
- Connection pooling (20-50 connections)
- Query optimization (EXPLAIN ANALYZE)
- Proper indexing (already defined)
- Read replicas for scaling

**Caching:**
- Redis for session store (TTL 15 min)
- React Query cache (staleTime 1 min)
- CDN caching for static assets

**Frontend:**
- Code splitting (lazy loading)
- Image optimization (WebP, lazy load)
- Virtual scrolling for large lists
- Debounced search/filter

---

## 🧪 Testing Strategy

### Backend Testing

**Unit Tests (pytest):**
```python
def test_create_entry():
    entry_data = {
        "title": "Test entry",
        "calendar_id": str(calendar_id)
    }
    entry = await entry_service.create(entry_data)
    assert entry.title == "Test entry"

def test_add_entry_to_task():
    entry = await entry_service.create({"title": "Test"})
    task = await task_service.create({"title": "Test Task"})
    
    updated_entry = await entry_service.add_to_task(entry.id, task.id)
    assert updated_entry.task_id == task.id
```

**Integration Tests:**
```python
@pytest.mark.asyncio
async def test_entry_creation_flow(client: TestClient):
    response = await client.post("/v1/entries", json={...})
    assert response.status_code == 201
    
    entry_id = response.json()["id"]
    
    # Verify it appears in list
    response = await client.get(f"/v1/entries?calendar_id={calendar_id}")
    entries = response.json()
    assert any(e["id"] == entry_id for e in entries)
```

**API Tests:**
- All endpoints have test coverage
- Test happy paths and error cases
- Test permissions and authorization

---

### Frontend Testing

**Unit Tests (Jest + React Testing Library):**
```typescript
test('Entry card displays correctly', () => {
  const entry = {
    id: '1',
    title: 'Test entry',
    is_completed: false
  };
  
  render(<EntryCard entry={entry} />);
  
  expect(screen.getByText('Test entry')).toBeInTheDocument();
  expect(screen.getByRole('checkbox')).not.toBeChecked();
});
```

**Integration Tests:**
```typescript
test('Completing an entry updates the UI', async () => {
  render(<EntryList />);
  
  const checkbox = screen.getByLabelText('Test entry');
  fireEvent.click(checkbox);
  
  await waitFor(() => {
    expect(checkbox).toBeChecked();
  });
});
```

**E2E Tests (Playwright):**
```typescript
test('User can create and complete entry', async ({ page }) => {
  await page.goto('/entries');
  
  await page.fill('[placeholder="Quick add..."]', 'New entry');
  await page.press('[placeholder="Quick add..."]', 'Enter');
  
  await expect(page.getByText('New entry')).toBeVisible();
  
  await page.click('[aria-label="Complete New entry"]');
  await expect(page.getByText('New entry')).toHaveClass(/completed/);
});
```

---

## 📦 Third-Party Services

### Required Services

**Email (SendGrid / AWS SES):**
- Welcome emails
- Password reset
- Notification emails
- Limit: 100 emails/day (free tier)

**File Storage (AWS S3):**
- Attachment storage
- User avatars
- Backups
- Limit: 5GB (free tier)

**Monitoring (Sentry):**
- Error tracking
- Performance monitoring
- User feedback
- Limit: 5k events/month (free tier)

### Optional Services

**Push Notifications (Firebase Cloud Messaging):**
- Mobile push notifications
- Limit: Unlimited (free)

**Analytics (PostHog):**
- User behavior tracking
- Feature usage
- A/B testing
- Limit: 1M events/month (free tier)

---

## 🎯 Implementation Milestones

### Phase 1: Core Backend (2 weeks)
- Database setup
- Authentication system
- Entry CRUD API
- Task CRUD API
- Basic WebSocket

### Phase 2: Core Frontend (2 weeks)
- Authentication UI
- Entry List View
- Calendar View (month)
- Task View
- Basic drag-and-drop

### Phase 3: Real-time & Polish (2 weeks)
- Complete WebSocket integration
- Optimistic updates
- Error handling
- Loading states
- Mobile responsive

### Phase 4: Advanced Features (2 weeks)
- Comments
- Attachments
- Search
- Bulk operations
- Performance optimization

### Phase 5: Mobile App (2 weeks)
- React Native setup
- Core screens
- Navigation
- Offline support
- Push notifications

### Phase 6: Testing & Launch (1 week)
- E2E tests
- Bug fixes
- Documentation
- Deployment
- Monitoring setup

**Total: 11 weeks for MVP**

---

## 🔄 Architecture Decision Records (ADRs)

### ADR-001: Why FastAPI over Django/Flask?

**Decision:** Use FastAPI for backend

**Rationale:**
- Native async support (critical for WebSocket)
- Automatic OpenAPI documentation
- Modern Python features (type hints)
- Excellent performance (comparable to Node.js)
- Active community and ecosystem

**Alternatives Considered:**
- Django: Too heavy, REST framework overhead, weaker async
- Flask: Lacks built-in async, more manual setup
- Node.js: Team has stronger Python expertise

---

### ADR-002: Why Zustand over Redux?

**Decision:** Use Zustand for client state management

**Rationale:**
- Minimal boilerplate
- Simple API, easier to learn
- Good TypeScript support
- No context provider wrapping needed
- Can combine with React Query for server state

**Alternatives Considered:**
- Redux: Too verbose for our needs
- MobX: Less common, team unfamiliar
- Context API: Not suitable for frequent updates

---

### ADR-003: Why PostgreSQL over MongoDB?

**Decision:** Use PostgreSQL as primary database

**Rationale:**
- Need ACID guarantees for calendar/task data
- Excellent support for relational data (entries ↔ tasks)
- JSONB for flexible fields when needed
- Array fields for tags
- Mature ecosystem and tooling

**Alternatives Considered:**
- MongoDB: Eventual consistency issues, harder to maintain relationships
- MySQL: Less flexible type system (no arrays, weaker JSON support)

---

### ADR-004: Monorepo vs. Separate Repos?

**Decision:** Monorepo with packages for web/mobile/shared

**Rationale:**
- Code sharing between web and mobile
- Atomic changes across frontend and backend
- Simplified dependency management
- Easier to maintain consistency

**Tools:** npm workspaces or Turborepo

---

## 📚 Documentation Requirements

**For Developers:**
- API documentation (OpenAPI/Swagger)
- Database schema documentation
- Architecture diagrams
- Development setup guide
- Contribution guidelines

**For Users:**
- User guide
- FAQ
- Video tutorials
- Keyboard shortcuts reference

---

## ✅ Plan Sign-Off

**This plan is complete when:**
- ✅ All technical decisions are documented
- ✅ Database schema is finalized
- ✅ API endpoints are defined
- ✅ Frontend architecture is clear
- ✅ Security measures are planned
- ✅ Testing strategy is defined

**Reviewers:**
- [ ] Backend Lead: _______________________
- [ ] Frontend Lead: _______________________
- [ ] DevOps Lead: _______________________
- [ ] Security Reviewer: _______________________

**Approval Date:** _______________________

---

**Next Phase:** Move to TASKS phase to break down implementation into specific, actionable work items.
