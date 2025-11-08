# 🚀 Frontend Spec-Driven Development Package
# Calendar + Task Management System

**Status:** ✅ Complete and Ready for Implementation  
**Last Updated:** 2024-11-09

---

## 📦 What You Have

You now have a **complete Frontend Spec-Driven Development (SDD) package** following GitHub's methodology. This package is specifically designed for frontend implementation and works in parallel with your backend SDD package.

### 📁 Package Contents

```
frontend-sdd/
├── README.md                      # 📚 This guide
├── 01_SPECIFY_FRONTEND.md         # 🎨 UI/UX Specification (936 lines)
├── 02_PLAN_FRONTEND.md            # 🏗️ Technical Architecture (1,400+ lines)
└── 03_TASKS_FRONTEND.md           # ✅ Implementation Tasks (2,000+ lines)
```

**Total:** ~4,300 lines of comprehensive frontend documentation

---

## 🎯 Quick Decision Tree

**Choose your path:**

### 👤 I'm a Product Designer / UX Lead
→ Read: `01_SPECIFY_FRONTEND.md`  
Focus on: UI layouts, interaction patterns, design system  
Time needed: 45 minutes

### 💻 I'm a Frontend Developer (Starting Fresh)
→ Read all three documents in order:
1. `01_SPECIFY_FRONTEND.md` (understand the UI/UX requirements)
2. `02_PLAN_FRONTEND.md` (understand the technical architecture)
3. `03_TASKS_FRONTEND.md` (start implementing)  
Time needed: 3 hours reading, then start coding

### 🤖 I'm Using AI Coding Agents
→ Jump to: "Using with AI Coding Agents" section below  
Time needed: 5 minutes to set up

### 🏗️ I'm a Frontend Architect
→ Read: `02_PLAN_FRONTEND.md` first  
Then review: `03_TASKS_FRONTEND.md` for implementation strategy  
Time needed: 2 hours

---

## 📋 What's Different from Backend SDD

This frontend package complements your backend SDD:

**Backend SDD (Already Complete):**
- Database design
- API endpoints
- Business logic
- Server architecture

**Frontend SDD (This Package):**
- UI components
- State management
- User interactions
- Real-time sync
- Mobile app

**They work together:** Frontend talks to backend via REST API + WebSocket

---

## 🎓 Understanding the Structure

### Phase 1: SPECIFY (What & Why - UI/UX Focus)

**File:** `01_SPECIFY_FRONTEND.md` (936 lines)

**Contains:**
- ✅ Design philosophy (Entry-first, Progressive disclosure)
- ✅ Three views detailed layouts (Calendar, Entry, Task)
- ✅ Component wireframes (with ASCII art mockups)
- ✅ Interaction patterns (Click, drag, swipe)
- ✅ Responsive design rules
- ✅ Accessibility requirements
- ✅ Animation specifications
- ✅ Design system (Colors, typography, spacing)

**Key Insight:**  
Users should be able to create entries in < 3 seconds. No forced fields except title. Organization comes later, not immediately.

**Example:**
```
Good: Type "Call client" → Press Enter → Done!
Bad: Click "Add" → Select type → Select calendar → Set time → Finally type title
```

---

### Phase 2: PLAN (How - Technical Architecture)

**File:** `02_PLAN_FRONTEND.md` (1,400+ lines)

**Contains:**
- ✅ Technology stack with rationale
  - Next.js 14 (App Router) for web
  - React Native + Expo for mobile
  - Zustand for client state
  - TanStack Query for server state
  - shadcn/ui + Tailwind for UI
- ✅ Complete project structure
- ✅ API integration strategy
- ✅ State management architecture
- ✅ Component design patterns
- ✅ WebSocket real-time sync
- ✅ Performance optimizations
- ✅ Testing strategy
- ✅ Security considerations

**Key Decisions:**

**Why Next.js?**
```
✅ SSR for better SEO and initial load
✅ App Router for better code splitting
✅ Built-in image optimization
✅ Great TypeScript support
```

**Why Zustand over Redux?**
```
✅ Lightweight (< 1KB gzipped)
✅ No boilerplate
✅ Simple API
✅ Easy to test
```

**State Management Strategy:**
```
Zustand → Client-side UI state (view, filters, selections)
TanStack Query → Server state (entries, tasks from API)
WebSocket → Real-time updates
```

---

### Phase 3: TASKS (Breakdown - What to Build)

**File:** `03_TASKS_FRONTEND.md` (2,000+ lines)

**Contains:**
- ✅ 7 Epics (high-level features)
- ✅ 28 Stories (user-facing functionality)
- ✅ 82 Tasks (specific implementation work)
- ✅ Each task includes:
  - Description with context
  - Code snippets and examples
  - Acceptance criteria (checkboxes)
  - Dependencies
  - Time estimate
  - Priority (P0/P1/P2/P3)

**Timeline:** 8 weeks with 2 frontend developers

**Epics Overview:**
1. **E1: Frontend Setup** (4 days) - Next.js, TypeScript, Tailwind
2. **E2: Authentication UI** (5 days) - Login, register forms
3. **E3: Calendar View** (10 days) - Month/week/day views
4. **E4: Entry Management** (8 days) - List, CRUD operations
5. **E5: Task Management** (7 days) - Task board, progress
6. **E6: Real-time Sync** (6 days) - WebSocket integration
7. **E7: Mobile App** (8 days) - React Native implementation

---

## 🚀 Getting Started (Human Developers)

### Step 1: Review the Documentation (3 hours)

```bash
# Day 1 Morning: Understand the UI/UX
Read: 01_SPECIFY_FRONTEND.md

Focus on:
- Design philosophy (Entry-first)
- Three views layouts
- Interaction patterns

# Day 1 Afternoon: Understand the architecture
Read: 02_PLAN_FRONTEND.md

Focus on:
- Technology stack decisions
- Component structure
- State management strategy

# Day 1 Evening: Plan your work
Read: 03_TASKS_FRONTEND.md

Focus on:
- Epic 1 (Setup) - Start here
- Task dependencies
- Timeline
```

### Step 2: Set Up Your Environment (4 hours)

```bash
# Follow Epic 1: Frontend Setup
1. Task 1.1.1: Initialize Next.js ← Start here
   npx create-next-app@latest packages/web --typescript --tailwind --app

2. Task 1.1.2: Setup Shared Package
   Create packages/shared for code reuse

3. Task 1.1.3: Install Dependencies
   npm install zustand @tanstack/react-query date-fns

4. Task 1.1.4: Setup shadcn/ui
   npx shadcn-ui@latest init

5. Task 1.2.1: Create Zustand Stores
   Set up entry, task, and UI stores

# By end of day, you should have:
✔ Next.js running on :3000
✔ TypeScript configured
✔ Tailwind CSS working
✔ shadcn/ui components available
✔ State management ready
```

### Step 3: Build Authentication (5 days)

```bash
# Follow Epic 2: Authentication UI
- Days 1-2: Login page with form validation
- Days 3-4: Register page
- Day 5: Auth context and protected routes

# By end of week, you should have:
✔ Users can register
✔ Users can login
✔ Token stored in localStorage
✔ Protected routes redirect to login
```

### Step 4: Continue with Core Features

Follow the task order in `03_TASKS_FRONTEND.md` Epic by Epic.

---

## 🤖 Using with AI Coding Agents

### Recommended Tools

- **Claude Code** (Anthropic, terminal-based)
- **GitHub Copilot Workspace**
- **Cursor** (VS Code fork with AI)
- **Aider** (command line AI pair programmer)

### Setup Process

#### Option A: Claude Code

```bash
# 1. Navigate to your project
cd /path/to/calendar-app

# 2. Start Claude Code
claude-code

# 3. Load the SDD documents
/add frontend-sdd/01_SPECIFY_FRONTEND.md
/add frontend-sdd/02_PLAN_FRONTEND.md
/add frontend-sdd/03_TASKS_FRONTEND.md

# 4. Start implementing
/task Implement Task 1.1.1: Initialize Next.js Project

# Claude will:
# - Read the task description
# - Follow the technical guidance
# - Create the necessary files
# - Verify acceptance criteria
```

#### Option B: Any Coding Agent

Use this prompt template:

```
I'm building the frontend for a calendar + task management system following Spec-Driven Development.

I have three specification documents:
1. 01_SPECIFY_FRONTEND.md - UI/UX requirements
2. 02_PLAN_FRONTEND.md - Technical architecture
3. 03_TASKS_FRONTEND.md - Task breakdown

I want you to implement Task [ID]: [Title]

[Paste the relevant task from 03_TASKS_FRONTEND.md]

Key context:
- We're using Next.js 14 with App Router
- State management: Zustand + TanStack Query
- UI: shadcn/ui + Tailwind CSS
- Backend API is at http://localhost:8000/api/v1

Please:
1. Read the task description carefully
2. Follow the technical guidance and code examples
3. Implement the code
4. Ensure all acceptance criteria are met

Show me what files need to be created or modified first.
```

---

## 🔑 Critical Architecture Decisions

### 1. Next.js App Router vs Pages Router

**We chose App Router:**
```
✅ Better code splitting
✅ Server components by default
✅ Improved data fetching
✅ Layouts and loading states
✅ Future-proof
```

**File structure:**
```
app/
├── (auth)/          # Auth group (different layout)
│   ├── login/
│   └── register/
├── (dashboard)/     # Main app group
│   ├── calendar/
│   ├── entries/
│   └── tasks/
├── layout.tsx       # Root layout
└── page.tsx         # Home page
```

### 2. State Management Strategy

**Two-tier approach:**

```typescript
// Client State (Zustand)
- UI state (current view, modals, sidebar)
- Filters and sorting preferences
- Selected items

// Server State (TanStack Query)
- Entries from API
- Tasks from API
- Automatic caching and refetching
- Optimistic updates

// Real-time Updates (WebSocket)
- Listen for changes from other clients
- Update TanStack Query cache
- UI reactively updates
```

### 3. Component Architecture

**Atomic Design Pattern:**
```
Atoms → Button, Input, Checkbox
Molecules → EntryCard, DatePicker
Organisms → EntryList, CalendarGrid, TaskBoard
Templates → DashboardLayout, AuthLayout
Pages → CalendarPage, EntriesPage, TasksPage
```

### 4. API Integration

**Centralized API Client:**
```typescript
// packages/shared/src/api/client.ts
- Handles auth tokens
- Auto-refreshes expired tokens
- Intercepts 401 errors
- Works for both web and mobile

// packages/shared/src/api/entries.ts
- Entry-specific API calls
- Type-safe with TypeScript
- Used by TanStack Query hooks
```

---

## 📊 Project Statistics

### Scope
- **8 weeks** for MVP (with 2 frontend developers)
- **82 tasks** total
- **45 P0/P1 tasks** (must have)
- **37 P2/P3 tasks** (nice to have)

### Code Estimates
- ~12,000 lines of TypeScript (web)
- ~8,000 lines of TypeScript (mobile)
- ~5,000 lines of shared code
- ~2,000 lines of tests

### Team Size Recommendations
- **1 developer**: 12-14 weeks
- **2 developers**: 8 weeks (web + mobile split)
- **3 developers**: 5-6 weeks (web + mobile + testing)

---

## ✅ Verification Checklist

Before you start implementation, ensure:

**Documentation:**
- [ ] I have read the README (this file)
- [ ] I understand the three-phase structure
- [ ] I have all three SDD files

**Understanding:**
- [ ] I understand the Entry-first philosophy
- [ ] I know Next.js App Router basics
- [ ] I'm familiar with Zustand or willing to learn
- [ ] I understand the backend API design

**Setup:**
- [ ] Node.js 18+ is installed
- [ ] I can run `npx create-next-app`
- [ ] Backend API is running (or will be)
- [ ] I'm ready to start with Epic 1, Task 1.1.1

---

## 🎯 Success Criteria

You'll know you're on track when:

**After Week 1:**
- [ ] Next.js project running
- [ ] TypeScript configured
- [ ] shadcn/ui components available
- [ ] Can login and see empty dashboard

**After Week 3:**
- [ ] Calendar view working
- [ ] Can see entries in month/week/day views
- [ ] Can navigate months
- [ ] Can click entry to see details

**After Week 5:**
- [ ] Entry list view working
- [ ] Can create, edit, delete entries
- [ ] Quick add works
- [ ] Filters and sorting work

**After Week 7:**
- [ ] Task board working
- [ ] Can create tasks
- [ ] Can add entries to tasks
- [ ] Progress tracking works
- [ ] WebSocket sync working

**After Week 8:**
- [ ] MVP complete
- [ ] All P0/P1 tasks done
- [ ] Mobile app working (basic)
- [ ] Tests passing
- [ ] Ready for testing

---

## 🛠️ Troubleshooting

### "Where do I start coding?"

→ Start: `03_TASKS_FRONTEND.md` → Epic 1 → Task 1.1.1  
→ Follow: The task order (dependencies are mapped)

### "The spec says use shadcn/ui but I prefer Material-UI"

→ You CAN swap libraries, but you'll need to update all component code  
→ Better: Stick with shadcn/ui for first iteration, refactor later if needed

### "How do I connect to the backend?"

→ Backend should be running on http://localhost:8000  
→ Update `NEXT_PUBLIC_API_URL` in `.env.local`  
→ See `02_PLAN_FRONTEND.md` section "API Integration Architecture"

### "Tasks are taking longer than estimated"

→ Normal: Estimates are approximate  
→ Check: Are you following the code examples?  
→ Ask: Are you blocked on backend API?

---

## 🔗 Integration with Backend

### How Frontend and Backend Work Together

```
┌─────────────────────────────────────────────────────────┐
│                      User Device                         │
│  ┌────────────────────────────────────────────────┐    │
│  │  Next.js App (Frontend)                        │    │
│  │  - Renders UI                                  │    │
│  │  - Manages state (Zustand + React Query)      │    │
│  │  - Handles user interactions                  │    │
│  └────────────┬─────────────────────────┬─────────┘    │
│               │                         │               │
│               │ HTTP REST API           │ WebSocket     │
│               │                         │               │
└───────────────┼─────────────────────────┼───────────────┘
                │                         │
┌───────────────┴─────────────────────────┴───────────────┐
│                   Backend Server                         │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  FastAPI      │  │ PostgreSQL   │  │ WebSocket   │ │
│  │  (Python)     │  │ Database     │  │ Server      │ │
│  └───────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### API Endpoints You'll Call

```typescript
// Entries
GET    /api/v1/entries?calendar_id=xxx
POST   /api/v1/entries
PATCH  /api/v1/entries/:id
DELETE /api/v1/entries/:id

// Tasks
GET    /api/v1/tasks?calendar_id=xxx
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id

// Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh

// WebSocket
WS     /ws/calendar/:calendarId?token=xxx
```

### Shared Types

Both frontend and backend should use compatible types:

```typescript
// Frontend: @/types/entry.ts
export interface Entry {
  id: string;
  calendar_id: string;
  title: string;
  content?: string;
  timestamp?: string;
  is_completed: boolean;
  // ... other fields
}

// Backend: app/schemas/entry.py
class EntryResponse(BaseModel):
    id: UUID
    calendar_id: UUID
    title: str
    content: Optional[str]
    timestamp: Optional[datetime]
    is_completed: bool
    # ... other fields
```

---

## 📚 Additional Resources

### In This Package
- `01_SPECIFY_FRONTEND.md` - UI/UX specification
- `02_PLAN_FRONTEND.md` - Technical architecture
- `03_TASKS_FRONTEND.md` - Implementation tasks

### Backend SDD (Separate Package)
- `01_SPECIFY.md` - Backend product spec
- `02_PLAN.md` - Backend architecture
- `03_TASKS.md` - Backend tasks

### External Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Native](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)

### Spec-Driven Development
- [GitHub SDD Guide](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai/)

---

## 📞 Need Help?

**Unclear about UI/UX requirements?**  
→ Re-read `01_SPECIFY_FRONTEND.md`

**Confused about architecture?**  
→ Re-read `02_PLAN_FRONTEND.md`

**Don't know what to build next?**  
→ Check `03_TASKS_FRONTEND.md` for next task

**Backend API not working?**  
→ Check if backend is running  
→ Verify API endpoint matches spec  
→ Check browser console for CORS errors

**WebSocket not connecting?**  
→ Verify backend WebSocket server is running  
→ Check auth token is valid  
→ Look for connection errors in console

---

## 🎉 Ready to Build!

You have everything you need:

✅ **Clear UI/UX design** - SPECIFY.md tells you what to build  
✅ **Technical architecture** - PLAN.md tells you how to build it  
✅ **Actionable tasks** - TASKS.md gives you step-by-step work  
✅ **Code examples** - Every task has implementation guidance  
✅ **Acceptance criteria** - You'll know when you're done  
✅ **Realistic timeline** - 8 weeks with 2 developers

**Next steps:**
1. Review all three SDD files (3 hours)
2. Set up Next.js project following Epic 1
3. Start implementing Task 1.1.1
4. Follow the dependencies
5. Track progress daily
6. Ship features weekly

---

## 📈 Comparison with Backend SDD

### What Backend Does
- ✅ Data persistence (PostgreSQL)
- ✅ Business logic (Python)
- ✅ API endpoints (FastAPI)
- ✅ WebSocket server
- ✅ Authentication (JWT)
- ✅ Background jobs (Celery)

### What Frontend Does
- ✅ User interface (React)
- ✅ User interactions (Events, drag-drop)
- ✅ State management (Zustand, React Query)
- ✅ API consumption (Axios)
- ✅ Real-time updates (WebSocket client)
- ✅ Responsive design (Mobile + Desktop)

**They work together to create a complete application!**

---

## 💡 Pro Tips

1. **Start Simple:** Get basic CRUD working before adding fancy features
2. **Use the Code Examples:** Tasks have copy-pasteable code to get you started
3. **Test as You Go:** Don't wait until the end to test features
4. **Commit Often:** Small, frequent commits are easier to debug
5. **Follow Dependencies:** Don't jump ahead if dependencies aren't done
6. **Read the Backend Spec:** Understanding the API helps frontend design
7. **Use DevTools:** React Query and Zustand have great debugging tools
8. **Mobile Later:** Focus on web first, then adapt to mobile

---

**Package Version:** 1.0  
**Created:** 2024-11-09  
**Status:** ✅ Ready for Implementation

**Next Action:** Read `03_TASKS_FRONTEND.md` and start with Task 1.1.1

---

**Let's build an amazing frontend! 🚀**
