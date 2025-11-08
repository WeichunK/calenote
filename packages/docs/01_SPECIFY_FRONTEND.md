# Frontend Phase 1: SPECIFY
# Calendar + Task Management System - Frontend UI/UX Specification

**Version:** 1.0  
**Last Updated:** 2024-11-08  
**Status:** Ready for Frontend Plan Phase  
**Based on:** Main SPECIFY.md v1.0

---

## 📋 Frontend Overview

This document defines the frontend user interface and user experience requirements. It focuses on what users see and interact with, not the technical implementation.

**Core Principle:** Progressive disclosure - show simple by default, reveal complexity on demand.

---

## 🎨 Design Philosophy

### 1. Entry-First Interaction

**Users should be able to:**
- Create entries in < 3 seconds
- Never be forced to fill required fields (except title)
- Decide organization later, not immediately

**Bad Example (Traditional):**
```
User clicks "Add"
→ Modal: "What type? (Event/Task/Note)"
→ "Select calendar"
→ "Set time" (required)
→ "Set category" (required)
→ Finally can type title
```

**Good Example (Our App):**
```
User types in quick-add box: "Call client"
→ Press Enter
→ Done! Entry created.
→ Can later: assign time, add to task, add details
```

### 2. View-Switching Without Context Loss

**Requirement:** When switching views, the user shouldn't feel lost.

**Techniques:**
- Persistent selection (selected entry highlighted in all views)
- Smooth transitions (300ms fade)
- Breadcrumb or view indicator
- Quick switcher (Cmd+1/2/3)

**Example Flow:**
```
User in Calendar View, clicks entry "Team meeting"
→ Entry detail modal opens
→ User clicks "View in Task View"
→ Smooth transition to Task View
→ Task containing "Team meeting" is auto-expanded
→ "Team meeting" entry is highlighted
```

### 3. Mobile-First, Desktop-Enhanced

**Mobile (Primary):**
- Touch-friendly (44px minimum tap targets)
- Swipe gestures for common actions
- Collapsible sections to save space
- Bottom navigation for main views

**Desktop (Enhanced):**
- Keyboard shortcuts (power users)
- Drag-and-drop for reorganization
- Split views (calendar + entry detail)
- Hover states and tooltips

---

## 🎯 User Interface Requirements

### Global Navigation

**Desktop:**
```
┌─────────────────────────────────────────────────┐
│ Logo  [Calendar][Entries][Tasks]    Q  👤  ⚙️  │ ← Header (fixed)
└─────────────────────────────────────────────────┘
```

**Mobile:**
```
┌─────────────────────────┐
│ [View Title]      Q  👤 │ ← Header
└─────────────────────────┘
         ⋮
         ⋮
┌─────────────────────────┐
│ 📅  📝  📦              │ ← Bottom Nav
│ Cal  List Tasks         │
└─────────────────────────┘
```

**Requirements:**
- [ ] Active view is highlighted
- [ ] Badge on views shows count (e.g., "3 unscheduled")
- [ ] Search accessible from all views (Q icon)
- [ ] User menu (👤) for profile, settings, logout

---

## 📅 Calendar View Detailed Specification

### View Modes

**Month View (Default):**

```
┌────────────────────────────────────────────────┐
│ ◀ March 2024 ▶          [Month][Week][Day]    │
├────────────────────────────────────────────────┤
│ Sun  Mon  Tue  Wed  Thu  Fri  Sat             │
├────────────────────────────────────────────────┤
│                  1    2    3    4              │
│                  📌   🔵                        │ ← Entry indicators
│                                                 │
│  5    6    7    8    9   10   11              │
│  ✓                📝   ⚠️                      │
│                                                 │
│ 12   13   14   15   16   17   18              │
│ TODAY                    📦                     │
│                                                 │
└────────────────────────────────────────────────┘

Legend:
🔵 = Event (has start/end time)
📝 = Note (all-day or no time)
✓  = Completed task
📌 = High priority
⚠️ = Overdue
📦 = Task (shows as container with progress)
```

**Visual Requirements:**
- [ ] Today cell has distinct background color
- [ ] Weekends have slightly different background
- [ ] Past dates are dimmed
- [ ] Cell size adapts to screen width
- [ ] Max 3 entries visible per cell
- [ ] If more than 3, show "+N more" link

**Entry Display in Calendar:**

```
┌─────────────────────────┐
│ March 15 (Friday)       │
├─────────────────────────┤
│ 09:00 Team standup  ✓   │ ← Completed event
│ 14:00 Client call   🔵  │ ← Upcoming event
│ Research notes      📝  │ ← Note (no time)
│                         │
│ 📦 Product Launch (3/5) │ ← Task with progress
│   ▶ View 5 items        │
└─────────────────────────┘
```

**Interaction Requirements:**

| Action | Desktop | Mobile |
|--------|---------|--------|
| View entry details | Click entry | Tap entry |
| Quick complete | Checkbox | Swipe right |
| Quick delete | Hover + X icon | Swipe left |
| Create entry | Double-click date | Long-press date |
| Drag to reschedule | Drag entry | (Not supported) |
| Navigate months | Arrow keys | Swipe left/right |

---

### Week View

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ ◀ Week of Mar 10, 2024 ▶        [Month][Week][Day]      │
├──────────────────────────────────────────────────────────┤
│      Mon 10  Tue 11  Wed 12  Thu 13  Fri 14  Sat 15     │
├──────────────────────────────────────────────────────────┤
│ 8am  ────────────────────────────────────────────────    │
│ 9am  [Team standup───]                                   │
│ 10am                  [Design review────────────]        │
│ 11am                                                      │
│ 12pm                                                      │
│ 1pm                            [Lunch]                    │
│ 2pm                                      [Client call──] │
└──────────────────────────────────────────────────────────┘
```

**Requirements:**
- [ ] Time slots in 1-hour increments (configurable to 30-min)
- [ ] All-day events shown at top
- [ ] Events span across time slots based on duration
- [ ] Overlapping events shown side-by-side
- [ ] Current time indicator (red line) if viewing current week
- [ ] Business hours (8am-6pm) more prominent, other hours collapsed

**Entry Card in Week View:**
```
┌────────────────────┐
│ 14:00-15:00        │ ← Time range
│ Client Presentation│ ← Title
│ 📍 Room A          │ ← Location (if exists)
│ 📦 Q2 Launch       │ ← Task (if belongs to one)
└────────────────────┘
```

---

### Day View

**Layout:**
```
┌────────────────────────────────────────────┐
│ ◀ Friday, March 15, 2024 ▶  [Month][Week][Day] │
├────────────────────────────────────────────┤
│ All Day:                                   │
│ ☐ Research notes                           │
│                                             │
├────────────────────────────────────────────┤
│ 8:00am                                     │
│ 9:00am ┌──────────────────────────┐       │
│        │ ✓ Team standup           │       │
│        │ 9:00 - 9:30             │       │
│        └──────────────────────────┘       │
│ 10:00am                                    │
│ 11:00am                                    │
│ 12:00pm                                    │
│ 1:00pm                                     │
│ 2:00pm ┌──────────────────────────┐       │
│        │ Client Presentation      │       │
│        │ 2:00 - 3:00             │       │
│        │ 📦 Part of: Q2 Launch   │       │
│        │ 📍 Conference Room A    │       │
│        └──────────────────────────┘       │
└────────────────────────────────────────────┘
```

**Requirements:**
- [ ] Scrollable timeline (24 hours)
- [ ] Current time indicator (now line)
- [ ] Empty time slots show "Click to add"
- [ ] Entry cards show more detail than week view
- [ ] Can see entry content preview (first 2 lines)

---

## 📝 Entry View Detailed Specification

### Layout Zones

```
Desktop Layout:
┌────────────────────────────────────────────────────────┐
│ [Search] [Sort: Created▼] [Filter] [+ New Entry]      │ ← Toolbar
├────────────────────────────────────────────────────────┤
│                                                         │
│ 📥 UNSCHEDULED (5)                          [Collapse] │ ← Section Header
│ ─────────────────────────────────────────────────────  │
│ ☐ Research competitor pricing                          │
│ ☐ Call vendor about supplies                           │
│ ☐ Design new homepage mockup                           │
│ 📝 Meeting notes from brainstorm...                    │
│ ☐ Update documentation                                 │
│                                                         │
│ 📅 SCHEDULED                                 [Collapse] │
│ ─────────────────────────────────────────────────────  │
│ Today (March 15)                                       │
│   ☐ 09:00 Team standup                                │
│   ✓ 14:00 Client presentation                         │
│                                                         │
│ Tomorrow (March 16)                                    │
│   ☐ 10:00 Budget review                               │
│                                                         │
│ This Week                                              │
│   ☐ 03/17 Project kickoff                             │
│   ☐ 03/18 Design critique                             │
│                                                         │
│ 📦 TASKS (3)                                 [Collapse] │
│ ─────────────────────────────────────────────────────  │
│ 📦 Q2 Product Launch (3/5 complete)                    │
│   ▶ View entries                                       │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Mobile Layout:**
```
┌──────────────────────────┐
│ [Q] Entries     [Filter] │
├──────────────────────────┤
│                          │
│ 📥 Unscheduled (5)    ▼  │
│                          │
│ ☐ Research pricing       │
│ ☐ Call vendor           │
│ 📝 Meeting notes        │
│ [+ Quick add]           │
│                          │
│ 📅 Today (2)          ▼  │
│                          │
│ ☐ 09:00 Standup         │
│ ✓ 14:00 Presentation    │
│                          │
└──────────────────────────┘
```

### Entry Card Component

**Collapsed State (List Item):**
```
┌─────────────────────────────────────────────┐
│ ☐ Call vendor about supplies          ⋮    │
│    🕐 Tomorrow 10:00  🏷️ work  ⚠️ High     │
│    📦 Product Launch                        │
└─────────────────────────────────────────────┘
 ↑                        ↑     ↑    ↑
 Checkbox                 Time  Tag  Priority
```

**Visual Elements:**
- [ ] Checkbox (20px) - left aligned
- [ ] Title (truncate at 1 line with ellipsis)
- [ ] Metadata row (grey text, smaller font)
  - [ ] Time (if scheduled)
  - [ ] Tags (max 2 visible, "+N more")
  - [ ] Priority indicator (color coded)
- [ ] Task badge (if belongs to task)
- [ ] Three-dot menu (right aligned)

**Expanded State (Modal/Drawer):**

```
┌───────────────────────────────────────────┐
│ X  Entry Details                     [⋮]  │ ← Header
├───────────────────────────────────────────┤
│ ☐ [Call vendor about supplies_______]    │ ← Title (editable)
│                                           │
│ 📝 Content                                │ ← Section
│ Need to discuss Q2 order quantities and  │
│ pricing for new product line.            │
│ [Click to edit]                           │
│                                           │
│ 🕐 Time                                   │
│ [Tomorrow, March 16]  [10:00 AM]         │
│                                           │
│ 📦 Task                                   │
│ [Product Launch ▼]  [Remove from task]   │
│                                           │
│ 🏷️ Tags                                   │
│ [work] [urgent] [+ Add tag]              │
│                                           │
│ ⚠️ Priority                               │
│ ○ None  ○ Low  ● Medium  ○ High         │
│                                           │
│ 📎 Attachments (0)                        │
│ [Drop files or click to upload]          │
│                                           │
│ 💬 Comments (2)                           │
│ Sarah: "Let's discuss this in standup"   │
│ [Add comment...]                          │
│                                           │
├───────────────────────────────────────────┤
│ [Delete]              [Save] [Cancel]     │ ← Footer
└───────────────────────────────────────────┘
```

### Quick Actions

**Hover State (Desktop):**
```
┌─────────────────────────────────────────────┐
│ ☐ Call vendor about supplies               │
│    [✓ Complete][📅 Schedule][📦 Add to task][🗑️ Delete] │
└─────────────────────────────────────────────┘
```

**Swipe Actions (Mobile):**

```
Swipe Right:
☐ Entry → [✓ Complete] Entry

Swipe Left:
Entry [🗑️ Delete] ←
```

### Filter and Sort

**Filter Panel:**
```
┌────────────────────────┐
│ Filters              X │
├────────────────────────┤
│ Entry Type             │
│ ☑ All                  │
│ ☐ Notes only           │
│ ☐ Tasks only           │
│ ☐ Events only          │
│                        │
│ Status                 │
│ ☐ Pending only         │
│ ☐ Completed only       │
│                        │
│ Time                   │
│ ☐ Scheduled            │
│ ☐ Unscheduled          │
│                        │
│ Task                   │
│ ☐ In a task            │
│ ☐ Not in a task        │
│ ☐ Specific task...     │
│                        │
│ Tags                   │
│ [Select tags...]       │
│                        │
│ Priority               │
│ ☐ High ☐ Medium        │
│ ☐ Low  ☐ None          │
│                        │
├────────────────────────┤
│ [Clear] [Apply]        │
└────────────────────────┘
```

**Sort Options:**
```
Sort by: [Created ▼]
  - Created (newest first)
  - Created (oldest first)
  - Timestamp (earliest first)
  - Timestamp (latest first)
  - Title (A-Z)
  - Title (Z-A)
  - Priority (high to low)
  - Priority (low to high)
```

---

## 📦 Task View Detailed Specification

### Kanban-Style Layout

```
Desktop:
┌────────────────────────────────────────────────────────┐
│ [+ New Task] [Sort: Position▼] [☐ Show completed]     │
├────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────┐  ┌─────────────────────┐     │
│ │ Q2 Product Launch   │  │ Hire New Developer  │     │
│ │ ⏰ Due: Mar 31      │  │ ⏰ Due: Apr 15      │     │
│ │ ───────────────────  │  │ ───────────────────  │     │
│ │ ▓▓▓▓▓▓░░░░ 60%      │  │ ▓░░░░░░░░░ 10%      │     │
│ │ 3 of 5 complete     │  │ 1 of 10 complete    │     │
│ │                     │  │                     │     │
│ │ ✓ Market research   │  │ ✓ Write job post    │     │
│ │ ✓ Design mockups    │  │ ☐ Review resumes    │     │
│ │ ✓ Dev sprint        │  │ ☐ Schedule calls    │     │
│ │ ☐ User testing      │  │ ...                 │     │
│ │ ☐ Launch plan       │  │                     │     │
│ │                     │  │ [View all]          │     │
│ │ [+ Add entry]       │  │ [+ Add entry]       │     │
│ │ [View details]      │  │ [View details]      │     │
│ └─────────────────────┘  └─────────────────────┘     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Task Card Component

**Collapsed Card:**
```
┌──────────────────────────────────┐
│ 📦 Q2 Product Launch      [⋮]    │ ← Header with menu
│ ⏰ Due: March 31, 2024           │ ← Due date (optional)
│ ────────────────────────────────  │
│ ▓▓▓▓▓▓░░░░ 60%                   │ ← Progress bar
│ 3 of 5 entries complete          │
│                                   │
│ [▶ View entries]  [+ Add entry]  │ ← Actions
└──────────────────────────────────┘
```

**Visual Requirements:**
- [ ] Color bar on left (task color)
- [ ] Progress bar animated on change
- [ ] Due date shows "Overdue" in red if past
- [ ] Compact mode shows only title + progress
- [ ] Can be dragged to reorder

**Expanded Card:**
```
┌────────────────────────────────────────────────┐
│ 📦 Q2 Product Launch                     [⋮] X │
│ ⏰ Due: March 31, 2024                         │
├────────────────────────────────────────────────┤
│ 📝 Description                                 │
│ Major product update focusing on new features  │
│ and improved UX. Target launch at end of Q2.  │
│                                                 │
│ ▓▓▓▓▓▓░░░░ 60% (3 of 5 complete)              │
│                                                 │
│ ✅ Entries                                     │
│ ─────────────────────────────────────────────  │
│ ✓ Market research        03/10                │
│ ✓ Design mockups         03/15                │
│ ✓ Development sprint     03/20                │
│ ☐ User testing           03/25                │
│ ☐ Launch plan            03/30                │
│                                                 │
│ [+ Add entry]                                  │
│                                                 │
│ 📎 Attachments (2)                             │
│ 💬 Comments (5)                                │
│                                                 │
├────────────────────────────────────────────────┤
│ [Archive] [Delete]            [Complete All]   │
└────────────────────────────────────────────────┘
```

### Entry Display in Task

**Entry List Item:**
```
┌────────────────────────────────────┐
│ ⋮⋮ ✓ Market research      03/10   │
│    📅 Scheduled  🏷️ research       │
└────────────────────────────────────┘
 ↑  ↑                          ↑
 Drag  Completed              Date
```

**Features:**
- [ ] Drag handle (⋮⋮) for reordering
- [ ] Checkbox to complete
- [ ] Shows scheduled time (if has timestamp)
- [ ] Click to open entry detail
- [ ] Strikethrough when completed

**Empty State:**
```
┌────────────────────────────────────┐
│ 📦 New Project                     │
│ ────────────────────────────────── │
│                                     │
│        📝                           │
│    No entries yet                  │
│                                     │
│   [+ Add your first entry]         │
│                                     │
└────────────────────────────────────┘
```

---

## 🎨 Visual Design System

### Color Palette

**Primary Colors:**
```
Primary Blue:   #4285F4  (buttons, links, active states)
Success Green:  #34A853  (completed, success messages)
Warning Orange: #FBBC04  (warnings, medium priority)
Error Red:      #EA4335  (errors, high priority, overdue)
```

**Neutral Colors:**
```
Text Primary:    #202124  (main text)
Text Secondary:  #5F6368  (metadata, labels)
Text Disabled:   #9AA0A6  (disabled text)
Background:      #FFFFFF  (main background)
Surface:         #F8F9FA  (cards, panels)
Border:          #DADCE0  (dividers, borders)
```

**Semantic Colors:**
```
Entry Types:
- Note:   #8AB4F8  (light blue)
- Task:   #81C995  (light green)
- Event:  #FDD663  (light yellow)

Priority:
- None:   (no color)
- Low:    #81C995  (green)
- Medium: #FBBC04  (orange)
- High:   #EA4335  (red)
```

### Typography

**Font Family:**
```
Primary:    Inter, system-ui, sans-serif
Monospace:  'Fira Code', monospace (for code blocks)
```

**Font Sizes:**
```
Title:       24px / 1.5rem  (bold)
Heading:     18px / 1.125rem (semibold)
Body:        14px / 0.875rem (regular)
Small:       12px / 0.75rem (regular)
Tiny:        10px / 0.625rem (medium, uppercase)
```

**Font Weights:**
```
Regular:   400
Medium:    500
Semibold:  600
Bold:      700
```

### Spacing Scale

```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
```

### Border Radius

```
sm:  4px   (small elements, tags)
md:  8px   (cards, buttons)
lg:  12px  (modals, large containers)
round: 50% (avatars, icon buttons)
```

### Shadows

```
sm:  0 1px 2px 0 rgba(0,0,0,0.05)         (subtle depth)
md:  0 4px 6px -1px rgba(0,0,0,0.1)       (cards, dropdowns)
lg:  0 10px 15px -3px rgba(0,0,0,0.1)     (modals, popovers)
xl:  0 20px 25px -5px rgba(0,0,0,0.1)     (important modals)
```

---

## 🔄 Interaction Patterns

### Drag and Drop

**Desktop Only:**

**Dragging Entry to Calendar:**
```
1. User hovers over entry in Entry View
2. Drag handle appears (⋮⋮)
3. User drags entry
4. Drop zones highlight on calendar
5. Drop on date cell
6. Entry gets timestamp, moves to Calendar View
7. Toast: "Entry scheduled for March 15"
```

**Dragging Entry to Task:**
```
1. User drags entry
2. Task cards highlight as drop zones
3. Drop on task card
4. Entry joins task
5. Task progress updates
6. Toast: "Entry added to Q2 Product Launch"
```

**Reordering Entries in Task:**
```
1. User drags entry within task
2. Other entries shift to show drop position
3. Release to reorder
4. Position saved immediately
```

**Visual Feedback:**
- [ ] Dragged item becomes semi-transparent
- [ ] Valid drop zones have blue border
- [ ] Invalid drop zones show "not allowed" cursor
- [ ] Smooth animations (200ms ease)

### Keyboard Shortcuts

**Global:**
```
/           Focus search
Cmd+1       Switch to Calendar View
Cmd+2       Switch to Entry View
Cmd+3       Switch to Task View
Cmd+K       Command palette (quick actions)
Cmd+N       New entry
Esc         Close modal/panel
```

**Entry List:**
```
↑/↓         Navigate entries
Enter       Open selected entry
Space       Toggle complete
Delete      Delete selected entry
```

**Calendar:**
```
←/→         Previous/next (month/week/day)
T           Go to today
N           New entry on selected date
```

---

## 📱 Mobile-Specific Patterns

### Gestures

**Entry List:**
```
Swipe Right →  Complete entry
Swipe Left  ←  Delete entry
Long Press     Open context menu
Pull Down      Refresh
```

**Calendar:**
```
Swipe Left  ←  Next month/week
Swipe Right →  Previous month/week
Pinch          Zoom (month ↔ week ↔ day)
```

### Mobile Navigation

**Bottom Tab Bar:**
```
┌───────────────────────────┐
│  📅      📝      📦      │
│ Calendar Entries  Tasks   │
└───────────────────────────┘
```

**Requirements:**
- [ ] Always visible (sticky)
- [ ] Active tab highlighted
- [ ] Badge shows count (e.g., "3" on Entries)
- [ ] Tap to switch, double-tap to scroll to top

### Mobile Modals

**Full-Screen on Small Screens:**
```
┌─────────────────────┐
│ ✕ Entry Details     │ ← Full screen
│                     │
│ [Content fills      │
│  entire screen]     │
│                     │
│                     │
│                     │
│ [Footer with        │
│  actions]           │
└─────────────────────┘
```

**Slide-Up on Larger Screens:**
```
┌─────────────────────┐
│                     │
│                     │
│ ╔═════════════════╗ │ ← Slides from bottom
│ ║ Entry Details   ║ │
│ ║                 ║ │
│ ║ [Content]       ║ │
│ ╚═════════════════╝ │
└─────────────────────┘
```

---

## ✅ Acceptance Criteria for UI/UX

### Calendar View
- [ ] Can view month/week/day
- [ ] Entries display on correct dates
- [ ] Can click entry to view details
- [ ] Can drag entry to reschedule (desktop)
- [ ] Today is highlighted
- [ ] Past dates are dimmed
- [ ] Can navigate months with keyboard

### Entry View
- [ ] Shows unscheduled and scheduled sections
- [ ] Can filter by type, status, time, task
- [ ] Can sort by multiple fields
- [ ] Quick add works (press Enter)
- [ ] Swipe actions work (mobile)
- [ ] Checkbox toggles completion
- [ ] Can bulk select and act on entries

### Task View
- [ ] Shows all tasks as cards
- [ ] Progress bars are accurate
- [ ] Can expand task to see entries
- [ ] Can add entry to task inline
- [ ] Can reorder entries in task (desktop)
- [ ] Empty state shows helpful message
- [ ] Can archive completed tasks

### Responsive Design
- [ ] Works on mobile (375px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1024px+ width)
- [ ] Touch targets minimum 44px
- [ ] Text is readable at all sizes
- [ ] No horizontal scroll

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Skip to main content link
- [ ] Form labels associated correctly

### Performance
- [ ] View switching < 300ms
- [ ] List scrolling smooth (60fps)
- [ ] No layout shift on load
- [ ] Images lazy loaded
- [ ] Virtual scrolling for large lists

---

## 🎬 Animation Specifications

### Transitions

**View Switching:**
```css
.view-enter {
  opacity: 0;
  transform: translateX(20px);
}

.view-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 300ms, transform 300ms;
}

.view-exit {
  opacity: 1;
  transform: translateX(0);
}

.view-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 300ms, transform 300ms;
}
```

**Modal Open/Close:**
```css
.modal-enter {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: opacity 200ms, transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**List Item Animation:**
```css
.list-item {
  transition: transform 200ms ease, opacity 200ms ease;
}

.list-item:hover {
  transform: translateX(4px);
}

.list-item-removed {
  opacity: 0;
  transform: translateX(-100%);
  transition: opacity 300ms, transform 300ms;
}
```

---

## 📝 Frontend Specification Sign-Off

**This specification is complete when:**
- ✅ All views are visually defined
- ✅ All interactions are specified
- ✅ Mobile and desktop patterns are clear
- ✅ Acceptance criteria are measurable
- ✅ Design system is documented
- ✅ Accessibility requirements are stated

**Reviewers:**
- [ ] Product Designer: _______________________
- [ ] Frontend Lead: _______________________
- [ ] UX Researcher: _______________________
- [ ] Accessibility Expert: _______________________

**Approval Date:** _______________________

---

**Next Phase:** Move to Frontend PLAN phase to define technical implementation details.
