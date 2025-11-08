# 🎯 Frontend SDD Quick Reference Guide

## 📦 Files Overview

```
frontend-sdd/
├── README.md                    ← Start here! (Setup guide)
├── 01_SPECIFY_FRONTEND.md      ← UI/UX design (What to build)
├── 02_PLAN_FRONTEND.md         ← Architecture (How to build)
└── 03_TASKS_FRONTEND.md        ← Tasks (Step-by-step work)
```

---

## ⚡ Quick Start (5 minutes)

```bash
# 1. Create Next.js project
npx create-next-app@latest packages/web --typescript --tailwind --app

# 2. Install core dependencies
npm install zustand @tanstack/react-query axios date-fns lucide-react

# 3. Setup shadcn/ui
npx shadcn-ui@latest init

# 4. Start dev server
npm run dev

# 5. Visit http://localhost:3000
```

---

## 🏗️ Tech Stack at a Glance

```
Framework:     Next.js 14 (App Router)
Language:      TypeScript
Styling:       Tailwind CSS
UI Library:    shadcn/ui (Radix UI)
State:         Zustand + TanStack Query
API Client:    Axios
Date Library:  date-fns
Icons:         lucide-react
Forms:         react-hook-form + zod
Drag & Drop:   @dnd-kit
Mobile:        React Native + Expo
```

---

## 📁 Project Structure (Web)

```
packages/web/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, register
│   ├── (dashboard)/       # Calendar, entries, tasks
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── calendar/          # Calendar-specific
│   ├── entries/           # Entry-specific
│   ├── tasks/             # Task-specific
│   └── layout/            # Header, sidebar
├── lib/
│   ├── api/               # API client
│   ├── hooks/             # Custom hooks
│   ├── stores/            # Zustand stores
│   └── utils/             # Helper functions
├── types/                 # TypeScript types
└── styles/                # Global styles
```

---

## 🗂️ Shared Package Structure

```
packages/shared/
├── src/
│   ├── types/             # Shared TypeScript types
│   │   ├── entry.ts
│   │   ├── task.ts
│   │   └── api.ts
│   ├── api/               # API client (web + mobile)
│   │   ├── client.ts
│   │   ├── entries.ts
│   │   └── tasks.ts
│   └── utils/             # Shared utilities
│       ├── date.ts
│       └── validation.ts
```

---

## 🎨 Key Design Principles

### 1. Entry-First Philosophy
```
✅ Entries can exist independently
✅ Entries optionally have timestamps
✅ Entries optionally belong to tasks
✅ No forced fields except title
```

### 2. Progressive Disclosure
```
✅ Show simple by default
✅ Reveal complexity on demand
✅ Quick add: Just type and press Enter
✅ Details: Edit later when needed
```

### 3. Three Views
```
📅 Calendar View: Time-based (entries with timestamps)
📝 Entry View:    List-based (all entries, sortable)
📦 Task View:     Project-based (tasks and their entries)
```

---

## 🔌 API Endpoints Reference

### Base URL
```
Development: http://localhost:8000/api/v1
Production:  https://api.yourapp.com/api/v1
```

### Authentication
```
POST /auth/register        Create account
POST /auth/login          Get access token
POST /auth/refresh        Refresh token
```

### Entries
```
GET    /entries?calendar_id=xxx           List entries
POST   /entries                            Create entry
GET    /entries/:id                        Get entry
PATCH  /entries/:id                        Update entry
DELETE /entries/:id                        Delete entry
POST   /entries/:id/complete               Toggle completion
POST   /entries/:id/add-to-task            Add to task
POST   /entries/:id/remove-from-task       Remove from task
```

### Tasks
```
GET    /tasks?calendar_id=xxx              List tasks
POST   /tasks                              Create task
GET    /tasks/:id                          Get task with entries
PATCH  /tasks/:id                          Update task
DELETE /tasks/:id                          Delete task
POST   /tasks/:id/reorder                  Reorder entries
```

### WebSocket
```
WS /ws/calendar/:calendarId?token=xxx

Events:
- entry:created
- entry:updated
- entry:deleted
- entry:completed
- task:updated
```

---

## 🏪 State Management Pattern

### Zustand Stores (Client State)
```typescript
// UI state
useUIStore()
  - currentView: 'calendar' | 'entries' | 'tasks'
  - calendarView: 'month' | 'week' | 'day'
  - selectedDate: Date
  - modals: open/close

// Entry filters
useEntryStore()
  - filters: { has_timestamp, is_completed, task_id }
  - sortBy: 'created_at' | 'timestamp' | 'priority'
  - selectedEntry: Entry | null
```

### TanStack Query (Server State)
```typescript
// Automatic caching, refetching, optimistic updates
useEntries(calendarId)
  - entries: Entry[]
  - isLoading: boolean
  - createEntry: Mutation
  - updateEntry: Mutation
  - deleteEntry: Mutation

useTasks(calendarId)
  - tasks: Task[]
  - isLoading: boolean
  - createTask: Mutation
```

### WebSocket (Real-time Sync)
```typescript
useWebSocket(calendarId)
  - Connects on mount
  - Listens for updates
  - Updates React Query cache
  - Auto-reconnects on disconnect
```

---

## 🎨 Component Patterns

### Example: EntryCard
```typescript
import { EntryCard } from '@/components/entries/EntryCard';

<EntryCard
  entry={entry}
  onToggleComplete={(id) => toggleComplete.mutate(id)}
  onClick={(entry) => openEntryModal(entry)}
/>
```

### Example: MonthView
```typescript
import { MonthView } from '@/components/calendar/MonthView';

<MonthView /> // Reads from useUIStore for selectedDate
```

### Example: QuickAdd
```typescript
import { QuickAdd } from '@/components/entries/QuickAdd';

<QuickAdd /> // Creates entry on Enter key
```

---

## 📊 Implementation Timeline

```
Week 1-2:   Setup & Auth (Epic 1-2)
Week 3-4:   Calendar View (Epic 3)
Week 5-6:   Entry & Task Management (Epic 4-5)
Week 7:     Real-time Sync (Epic 6)
Week 8:     Mobile App (Epic 7)

Total: 8 weeks with 2 frontend developers
```

---

## ✅ Task Priority Guide

```
P0 (Blocker):  Must complete before other work
               Example: Project setup, authentication

P1 (High):     Core functionality, complete ASAP
               Example: Calendar view, entry CRUD

P2 (Medium):   Important but not blocking
               Example: Filters, sorting, search

P3 (Low):      Nice to have, can defer
               Example: Keyboard shortcuts, animations
```

---

## 🐛 Common Issues & Solutions

### Issue: "CORS error when calling API"
```bash
# Backend needs CORS configuration
# In backend .env:
BACKEND_CORS_ORIGINS='["http://localhost:3000"]'
```

### Issue: "TypeScript errors with shared package"
```bash
# Ensure shared package is properly linked
cd packages/shared && npm run build
cd ../web && npm install ../shared
```

### Issue: "shadcn/ui components not found"
```bash
# Install specific component
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
```

### Issue: "WebSocket connection fails"
```bash
# Check backend is running
# Check token is valid
# Check WebSocket URL in .env.local
```

---

## 🔐 Environment Variables

### Create `.env.local` in packages/web:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_ENV=development
```

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test EntryCard.test.tsx

# Run with coverage
npm test -- --coverage

# E2E tests
npm run test:e2e
```

---

## 📦 Build & Deployment

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

---

## 🎯 First Week Checklist

**Day 1:**
- [ ] Create Next.js project
- [ ] Setup TypeScript configuration
- [ ] Install core dependencies
- [ ] Setup shadcn/ui

**Day 2:**
- [ ] Create shared package
- [ ] Setup API client
- [ ] Create Zustand stores
- [ ] Setup React Query

**Day 3:**
- [ ] Create root layout
- [ ] Create header component
- [ ] Create sidebar component
- [ ] Test routing

**Day 4:**
- [ ] Create login page
- [ ] Create register page
- [ ] Setup auth context
- [ ] Test authentication flow

**Day 5:**
- [ ] Create protected route HOC
- [ ] Setup calendar page skeleton
- [ ] Setup entries page skeleton
- [ ] Setup tasks page skeleton

**By End of Week:**
- [ ] Can login/register
- [ ] Can navigate between views
- [ ] Basic layout is complete
- [ ] Ready to build features

---

## 📚 Where to Find Information

**UI/UX Questions:**
→ Read `01_SPECIFY_FRONTEND.md`

**Architecture Questions:**
→ Read `02_PLAN_FRONTEND.md`

**Implementation Questions:**
→ Read `03_TASKS_FRONTEND.md`

**API Questions:**
→ Check backend SDD or `02_PLAN_FRONTEND.md` API section

**Stuck on a Task:**
→ Check task's "Technical Guidance" section
→ Look at code examples in the task
→ Check dependencies are complete

---

## 🔗 Useful Links

**Documentation:**
- [Next.js Docs](https://nextjs.org/docs)
- [Zustand](https://docs.pmnd.rs/zustand)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind](https://tailwindcss.com)

**Examples:**
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [shadcn/ui Examples](https://ui.shadcn.com/examples)

**Community:**
- [Next.js Discord](https://nextjs.org/discord)
- [React Discord](https://discord.gg/react)

---

## 💡 Pro Tips

1. **Read Task Examples:** Every task has code snippets - use them!
2. **Follow Dependencies:** Don't skip ahead
3. **Test Often:** Test each component as you build
4. **Use DevTools:** React Query and Zustand have great dev tools
5. **Commit Frequently:** Small commits are easier to debug
6. **Ask Questions:** If something is unclear, ask!
7. **Reference Backend:** Understanding the API helps frontend design

---

## 🎉 You're Ready!

Open `03_TASKS_FRONTEND.md` and start with:

**Epic 1, Task 1.1.1: Initialize Next.js Project**

Happy coding! 🚀
