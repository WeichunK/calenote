# Phase 1: SPECIFY
# Calendar + Task Management System - Product Specification

**Version:** 1.0  
**Last Updated:** 2025-11-08  
**Status:** Ready for Plan Phase

---

## 📋 Executive Summary

A flexible, entry-first calendar and task management system that allows users to capture ideas quickly, organize them naturally, and visualize their time effectively through three complementary views.

**Core Innovation:** Entries are the first-class citizens. Users can create entries instantly without forcing them into rigid structures, then optionally organize them into tasks as natural groupings emerge.

---

## 🎯 Problem Statement

### Current Pain Points

**Traditional Calendar Apps (Google Calendar, Apple Calendar):**
- ❌ Force users to assign time to everything immediately
- ❌ Don't support granular task tracking within events
- ❌ No natural way to handle "someday/maybe" items
- ❌ Difficult to see task progress within time-bound events

**Traditional Task Apps (Todoist, Things):**
- ❌ Time visualization is weak or non-existent
- ❌ Hard to see how tasks relate to your actual schedule
- ❌ Lack of collaborative event features
- ❌ Can't easily group related entries without rigid project structures

**Hybrid Apps (Notion, ClickUp):**
- ❌ Too complex for quick capture
- ❌ Steep learning curve
- ❌ Mobile experience is often compromised
- ❌ Not optimized for calendar-first thinking

### Our Solution

A system where **entries** are the atomic unit. Users can:
1. Quickly capture entries (notes, tasks, events)
2. Optionally assign time (scheduled) or leave unscheduled
3. Optionally group entries into tasks for organization
4. Switch between three views depending on their current need

---

## 👥 Target Users

### Primary Persona: "Flexible Planner" (70% of users)

**Demographics:**
- Age: 25-45
- Occupation: Knowledge workers, freelancers, project managers
- Tech-savvy, uses multiple productivity tools

**Behaviors:**
- Captures ideas throughout the day
- Needs both structure and flexibility
- Works on multiple projects simultaneously
- Collaborates with small teams (2-10 people)

**Goals:**
- Quick capture without friction
- See both timeline and task breakdown
- Understand what's urgent vs. important
- Track progress on multi-step initiatives

**Frustrations:**
- Current tools force premature organization
- Can't see both time and task dimensions easily
- Switching between apps breaks flow

### Secondary Persona: "Team Coordinator" (20% of users)

**Additional Needs:**
- Share calendars with team members
- Track who's responsible for what
- See progress on shared initiatives
- Real-time updates when things change

### Tertiary Persona: "Personal Organizer" (10% of users)

**Focus:**
- Personal life management
- Family calendar coordination
- Habit tracking and routines

---

## 🌟 User Journeys

### Journey 1: Quick Capture to Organized Execution

**Scenario:** Sarah has several ideas during a brainstorming session

**Steps:**
1. **Quick Capture (Entry View)**
   - Opens app on phone
   - Rapidly types several entries:
     - "Research competitor pricing"
     - "Design new homepage mockup"
     - "Call vendor about supplies"
     - "Meeting notes from brainstorm..."
   - All entries are created instantly, no time required
   - All appear in "Unscheduled" section

2. **Organization (Entry View → Task View)**
   - Later, Sarah reviews her entries
   - She realizes 3 entries relate to a product launch
   - She creates a task "Q2 Product Launch"
   - Drags the 3 related entries into this task
   - Other entries remain independent

3. **Scheduling (Entry View → Calendar View)**
   - Sarah drags "Call vendor about supplies" to tomorrow at 10am
   - The entry now appears in both:
     - Calendar View (tomorrow at 10am)
     - Entry View (with time stamp)
     - Task View (if it's in a task)

4. **Execution (All Views)**
   - Next day, she opens Calendar View
   - Sees "Call vendor" at 10am
   - Completes it, checks it off
   - WebSocket syncs to all her devices
   - Task progress updates automatically

**Key Moments:**
- ✨ No friction during capture
- ✨ Organization happens naturally when ready
- ✨ Time assignment is optional and flexible
- ✨ Progress visible in multiple contexts

---

### Journey 2: Event with Preparation Tasks

**Scenario:** Mark needs to prepare for an important client presentation

**Steps:**
1. **Create Event (Calendar View)**
   - Mark creates "Client Presentation" on March 15 at 2pm
   - Entry appears in Calendar View

2. **Add Preparation Items (Entry View)**
   - Opens Entry View
   - Creates several related entries:
     - "Finalize slides"
     - "Practice presentation"
     - "Prepare demo"
     - "Print handouts"
   - None have times yet

3. **Group as Task (Task View)**
   - Opens Task View
   - Creates task "Client Presentation Prep"
   - Drags all entries into this task
   - Can see task completion: 0/4 done

4. **Schedule Preparation (Calendar View)**
   - Drags "Finalize slides" to March 12
   - Drags "Practice presentation" to March 14
   - Leaves "Print handouts" unscheduled for now
   - Calendar shows both the event and preparation items

5. **Collaborate (All Views)**
   - Shares calendar with team member
   - Assigns "Prepare demo" to colleague
   - Colleague sees it in their Entry View
   - Real-time updates via WebSocket

**Key Moments:**
- ✨ Event and preparation can be linked
- ✨ Preparation items can have different times
- ✨ Clear visibility of what's done vs. pending
- ✨ Team can coordinate naturally

---

### Journey 3: Unscheduled Task Management

**Scenario:** Lisa has ongoing responsibilities without specific deadlines

**Steps:**
1. **Capture Responsibilities (Entry View)**
   - Creates entries:
     - "Review team timesheets" (weekly recurring)
     - "Update project documentation"
     - "Research new tools"
     - "Mentor junior developer"
   - None have specific times

2. **Organize by Context (Task View)**
   - Groups entries into tasks:
     - Task: "Weekly Admin" → contains "Review team timesheets"
     - Task: "Technical Debt" → contains documentation and research
     - Task: "Team Development" → contains mentoring items

3. **Work from Entry View**
   - Each day, Lisa opens Entry View
   - Sorts by priority
   - Works through unscheduled entries
   - Checks them off as completed

4. **Optional Scheduling**
   - When she has time, she drags some entries to calendar
   - Others remain in unscheduled area
   - Both approaches work seamlessly

**Key Moments:**
- ✨ Not everything needs a time
- ✨ Still organized and trackable
- ✨ Flexible workflow supports her style

---

## 🎨 Core Concepts

### 1. Entry: The First-Class Citizen

**Definition:**  
An entry is the atomic unit of the system. It represents a single piece of information, task, or event.

**Properties:**
- **Title** (required): Brief description
- **Content** (optional): Rich text details, markdown supported
- **Type** (note/task/event): Semantic meaning
- **Timestamp** (optional): When it happens or is due
- **Completion Status** (boolean): Done or not done
- **Task Membership** (optional): Belongs to a task
- **Tags** (optional): Labels for categorization
- **Priority** (0-3): Importance level
- **Attachments** (optional): Files, images
- **Comments** (optional): Discussion thread

**Key Principle:**  
Entries can exist independently. They don't require a task, don't require a time, and don't require categorization. The user decides how to organize them.

---

### 2. Task: The Grouping Container

**Definition:**  
A task is a container that groups related entries. It provides progress tracking and organization.

**Important:** Tasks do NOT have timestamps. Time belongs to entries.

**Properties:**
- **Title** (required): Name of the task
- **Description** (optional): What this task represents
- **Due Date** (optional): Soft deadline for the entire task
- **Status** (active/completed/archived): Overall state
- **Progress** (auto-calculated): Based on entry completion
- **Color/Icon** (optional): Visual identifier
- **Entries** (0 to many): The actual work items

**Example:**
```
Task: "Q2 Product Launch"
├─ Entry: "Market research" (completed, no time)
├─ Entry: "Design mockups" (in progress, scheduled for 3/10)
├─ Entry: "Development sprint" (pending, scheduled for 3/15-3/20)
└─ Entry: "Launch announcement" (pending, scheduled for 3/25)

Task completion: 25% (1/4 entries complete)
```

**Key Principle:**  
Tasks are optional organizational tools. An entry can belong to zero or one task. Users create tasks when natural groupings emerge, not because the system forces it.

---

### 3. Three Views: Different Lenses on the Same Data

#### Calendar View (Time Dimension)
**Purpose:** See what's happening when  
**Shows:** All entries with timestamps, arranged by date/time  
**Use Case:** Planning your day, seeing availability, time-boxing work

**Behavior:**
- Displays entries on their scheduled dates
- If an entry belongs to a task, shows task context (color, label)
- Can expand tasks to see all scheduled entries within them
- Drag entries to reschedule
- Empty dates show "no scheduled items"

**What's NOT shown:** 
- Unscheduled entries
- Tasks themselves (only their entries)

---

#### Entry View (List Dimension)
**Purpose:** See all entries, manage completion, review everything  
**Shows:** All entries with flexible sorting and filtering  
**Use Case:** Daily work mode, triage, bulk operations

**Organization:**
```
📥 Unscheduled (items without timestamps)
├─ Sort by: created, priority, type
└─ Quick actions: assign time, add to task, complete

📅 Scheduled (items with timestamps)
├─ Group by: today, this week, later
└─ Includes entries that belong to tasks

📦 Tasks (grouped view)
├─ Show entries grouped by their task
└─ Expand/collapse tasks

📝 All Entries (flat list)
└─ Every entry, regardless of organization
```

**Key Features:**
- Powerful sorting (creation date, time, priority, name, type)
- Filtering (completed/pending, with/without time, by task, by tag)
- Bulk actions (move to task, set time, change priority)
- Search across all fields

---

#### Task View (Project Dimension)
**Purpose:** See progress on multi-step initiatives  
**Shows:** All tasks and their contained entries  
**Use Case:** Project management, progress tracking, team coordination

**Layout:**
```
Task Card 1: "Client Presentation Prep"
├─ Progress: ▓▓▓▓░░░░ 50% (2/4 complete)
├─ Due Date: March 15 (optional)
├─ Entries:
│   ├─ ✓ Finalize slides (3/12 10am)
│   ├─ ✓ Practice presentation (3/14 2pm)
│   ├─ ☐ Prepare demo (no time)
│   └─ ☐ Print handouts (no time)
└─ [Expand for details] [Add Entry] [Complete All]

Task Card 2: "Q2 Product Launch"
├─ Progress: ▓░░░░░░░ 10% (1/10 complete)
└─ ...
```

**Key Features:**
- Kanban-style cards
- Progress bars for visual tracking
- Time distribution (earliest and latest entry times)
- Quick entry creation within task context
- Archive completed tasks

---

## 🔄 Key Interactions

### Core Workflow: Entry Lifecycle

```
1. CREATE
   ↓
   Entry exists independently
   (no task, no time)
   ↓
2. ORGANIZE (optional)
   ↓
   Add to task for grouping
   ↓
3. SCHEDULE (optional)
   ↓
   Assign timestamp
   ↓
4. COMPLETE
   ↓
   Check off, mark done
   ↓
5. ARCHIVE or DELETE
```

**Key Points:**
- Steps 2 and 3 are optional and in any order
- An entry can have time but no task
- An entry can have task but no time
- An entry can have both or neither

---

### View Switching

**Seamless Context:**
- Clicking an entry in Calendar View opens its details
- From details, can switch to Task View if entry belongs to a task
- From Task View, can click "Show in Calendar" to see time context
- State is preserved (selected entry, scroll position, filters)

**Transition Animations:**
- Smooth fade between views (300ms)
- Highlighted entry remains visible during transition
- No jarring context loss

---

### Real-Time Collaboration

**WebSocket Sync:**
- When user A completes an entry, user B sees it immediately
- When user A adds entry to task, user B sees progress update
- When user A reschedules, user B sees calendar update

**Presence Indicators:**
```
👁️ Alex is viewing this entry
✏️ Jordan is editing "Client Presentation"
🔔 New comment from Sam
```

**Conflict Resolution:**
- Optimistic updates (immediate local response)
- Last-write-wins for most fields
- If conflict detected, show merge dialog

---

## ✅ Success Metrics

### User Engagement
- **Daily Active Users (DAU):** 60% of registered users
- **Entry Creation Rate:** Average 5+ entries per user per day
- **View Switching:** Users switch between views 3+ times per session
- **Retention:** 70% of users active after 30 days

### Feature Adoption
- **Task Usage:** 40% of entries belong to tasks
- **Scheduling:** 60% of entries have timestamps
- **Collaboration:** 30% of calendars are shared
- **Mobile Usage:** 50% of sessions on mobile devices

### Performance
- **Entry Creation:** < 200ms response time
- **View Switching:** < 300ms transition
- **WebSocket Latency:** < 500ms for sync
- **Calendar Load:** < 1s for 1 month of data

### Quality
- **Bug Report Rate:** < 0.5% of sessions
- **Crash Rate:** < 0.1% of sessions
- **API Error Rate:** < 0.5% of requests

---

## 🚫 What This Is NOT

**This is NOT:**
- ❌ A project management tool like Jira (no sprints, no burndown charts)
- ❌ A note-taking app like Evernote (focused on actionable items)
- ❌ A time-tracking tool (no billing or time sheets)
- ❌ A habit tracker (no streaks or recurring goals)
- ❌ An email client (no inbox management)

**This IS:**
- ✅ A flexible capture system
- ✅ A time visualization tool
- ✅ A simple task organizer
- ✅ A team coordination tool

---

## 🎬 Launch Criteria

### Minimum Viable Product (MVP)

**Must Have:**
- ✅ Entry CRUD (create, read, update, delete)
- ✅ Three views (calendar, entry, task)
- ✅ Drag-and-drop to organize and schedule
- ✅ Basic authentication and multi-user support
- ✅ Real-time sync via WebSocket
- ✅ Mobile-responsive web app

**Should Have:**
- ✅ Native mobile app (iOS/Android via React Native)
- ✅ Offline support with sync queue
- ✅ File attachments
- ✅ Comments on entries
- ✅ Calendar sharing with permissions

**Could Have (Post-MVP):**
- ⚪ Templates for common task types
- ⚪ Natural language input ("tomorrow at 3pm")
- ⚪ Calendar export (iCal)
- ⚪ Integrations (Slack, email)
- ⚪ AI-powered suggestions

---

## 🔐 Non-Functional Requirements

### Security
- All passwords hashed with bcrypt
- JWT tokens for authentication
- HTTPS only in production
- Rate limiting on API endpoints
- User data isolated by calendar membership

### Privacy
- Users control who sees their calendars
- No ads, no data selling
- Export all user data on request
- Delete all user data on account deletion

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all features
- Screen reader support
- High contrast mode
- Minimum touch target size: 44x44px

### Internationalization
- Initially: English (US)
- Future: Mandarin, Spanish, Japanese
- Support for different date formats
- Support for different time zones

---

## 📱 Platform Requirements

### Web Application
- **Desktop:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Responsive:** Works on tablets (iPad, Android tablets)
- **PWA Support:** Can be installed as app

### Mobile Application
- **iOS:** 14.0+
- **Android:** API 21+ (Android 5.0+)
- **Native features:** Push notifications, offline storage

---

## 🎨 Design Principles

1. **Entry-First:** Everything starts as an entry. Organization comes later.
2. **Progressive Disclosure:** Show simple by default, reveal complexity on demand.
3. **Multi-Modal:** Support different work styles (calendar-first, list-first, project-first).
4. **Fast Capture:** Never make the user wait or fill required fields.
5. **Flexible Structure:** Don't force premature organization.
6. **Visual Clarity:** Use color, spacing, and hierarchy to reduce cognitive load.
7. **Mobile-First:** Design for phone, scale up to desktop.

---

## 🔄 Future Enhancements (Out of Scope for MVP)

### Phase 2 (3-6 months post-launch)
- Recurring entries
- Calendar sync (Google Calendar, Outlook)
- Time blocking automation
- Entry templates
- Advanced search

### Phase 3 (6-12 months post-launch)
- Team workspaces
- Analytics and insights
- API for third-party integrations
- Desktop applications (Electron)
- Browser extensions

---

## ✋ Open Questions

These need answers before moving to Plan phase:

1. **Multi-Calendar Support:** Can users have multiple calendars? Or one calendar with multiple members?
   - **Current assumption:** One calendar per workspace, users can belong to multiple workspaces

2. **Entry Types:** Should we enforce different behaviors for note/task/event types?
   - **Current assumption:** Type is informational only, doesn't change behavior

3. **Permissions:** What permission levels do we need? (viewer, editor, admin)
   - **Current assumption:** Start with owner/member, expand later

4. **Notifications:** What triggers notifications? (task assigned, entry commented, deadline approaching)
   - **Current assumption:** All collaboration events, user can mute per calendar

5. **Data Limits:** How many entries/tasks per user?
   - **Current assumption:** No hard limit for MVP, monitor and add if needed

---

## 📝 Specification Sign-Off

**This specification is complete when:**
- ✅ All user journeys are validated
- ✅ Core concepts are clear and agreed upon
- ✅ Success metrics are measurable
- ✅ Open questions are resolved
- ✅ Stakeholders have reviewed and approved

**Reviewers:**
- [ ] Product Owner: _______________________
- [ ] Engineering Lead: _______________________
- [ ] Design Lead: _______________________
- [ ] User Representative: _______________________

**Approval Date:** _______________________

---

**Next Phase:** Move to PLAN phase to define technical architecture and implementation strategy.
