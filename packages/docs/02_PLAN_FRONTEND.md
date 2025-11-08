# Phase 2: PLAN (Frontend)
# Calendar + Task Management System - Frontend Technical Plan

**Version:** 1.0  
**Last Updated:** 2024-11-09  
**Status:** Ready for Implementation  
**Based on:** 01_SPECIFY_FRONTEND.md v1.0 + Backend API Design

---

## 📋 Document Purpose

This document defines **HOW** the frontend will be built technically. It covers:
- Technology stack decisions
- Architecture patterns
- State management strategy
- API integration approach
- Component structure
- Performance optimizations
- Testing strategy

**This is NOT:**
- UI/UX design (see 01_SPECIFY_FRONTEND.md)
- Task breakdown (see 03_TASKS_FRONTEND.md)
- Backend architecture (see backend PLAN.md)

---

## 🎯 Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Devices                             │
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   Web Browser    │              │  Mobile Device   │         │
│  │   (React/Next)   │              │  (React Native)  │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
│           │                                  │                    │
└───────────┼──────────────────────────────────┼───────────────────┘
            │                                  │
            │         HTTP/REST + WebSocket    │
            │                                  │
┌───────────┴──────────────────────────────────┴───────────────────┐
│                      Backend Services                             │
│                                                                   │
│  ┌────────────┐  ┌───────────┐  ┌────────────┐  ┌────────────┐ │
│  │  FastAPI   │  │PostgreSQL │  │   Redis    │  │ WebSocket  │ │
│  │    API     │  │  Database │  │   Cache    │  │   Server   │ │
│  └────────────┘  └───────────┘  └────────────┘  └────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Core Framework

**Web: Next.js 14 (App Router)**

```
Rationale:
✅ Server-side rendering for better SEO and initial load
✅ App Router provides better code splitting
✅ Built-in API routes for BFF (Backend-for-Frontend) if needed
✅ Image optimization out of the box
✅ Great developer experience with Fast Refresh
✅ Strong TypeScript support
```

**Mobile: React Native 0.73 + Expo 50**

```
Rationale:
✅ Code sharing with web (70-80% shared business logic)
✅ Expo provides easier build and deployment
✅ Over-the-air updates for quick iterations
✅ Strong community and ecosystem
✅ Native performance with JS flexibility
```

### State Management

**Zustand 4.4 (Primary)**

```typescript
Rationale:
✅ Lightweight (< 1KB gzipped)
✅ Simple API, no boilerplate
✅ Built-in TypeScript support
✅ Middleware for persistence, devtools
✅ Easy to test

Example Store:
// stores/entryStore.ts
import { create } from 'zustand';

interface EntryStore {
  entries: Entry[];
  selectedEntry: Entry | null;
  setEntries: (entries: Entry[]) => void;
  selectEntry: (entry: Entry) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
}

export const useEntryStore = create<EntryStore>((set) => ({
  entries: [],
  selectedEntry: null,
  setEntries: (entries) => set({ entries }),
  selectEntry: (entry) => set({ selectedEntry: entry }),
  addEntry: (entry) => set((state) => ({ 
    entries: [...state.entries, entry] 
  })),
  updateEntry: (id, updates) => set((state) => ({
    entries: state.entries.map(e => 
      e.id === id ? { ...e, ...updates } : e
    )
  })),
  deleteEntry: (id) => set((state) => ({
    entries: state.entries.filter(e => e.id !== id)
  }))
}));
```

**TanStack Query (React Query) 5.x for Server State**

```typescript
Rationale:
✅ Automatic caching and background refetching
✅ Optimistic updates support
✅ Request deduplication
✅ Built-in loading and error states
✅ DevTools for debugging

Example Hook:
// hooks/useEntries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useEntries = (calendarId: string) => {
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['entries', calendarId],
    queryFn: () => api.getEntries(calendarId),
    staleTime: 30000, // 30 seconds
  });

  const createEntry = useMutation({
    mutationFn: api.createEntry,
    onSuccess: (newEntry) => {
      queryClient.setQueryData(
        ['entries', calendarId],
        (old: Entry[]) => [...old, newEntry]
      );
    },
  });

  return { entries, isLoading, createEntry };
};
```

### UI Component Library

**shadcn/ui + Tailwind CSS 3.4**

```
Rationale:
✅ Copy-paste components (full control)
✅ Built on Radix UI (accessible by default)
✅ Tailwind for utility-first styling
✅ Customizable design system
✅ Tree-shakable (only bundle what you use)
✅ No runtime overhead
```

**Component Architecture:**
```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
};
```

### Date/Time Handling

**date-fns 3.x**

```typescript
Rationale:
✅ Lightweight (tree-shakable)
✅ Immutable functions
✅ TypeScript support
✅ Timezone support via date-fns-tz
✅ Better performance than moment.js

Example Usage:
import { format, isToday, addDays, parseISO } from 'date-fns';

// Format timestamp
format(new Date(), 'yyyy-MM-dd HH:mm:ss'); // "2024-03-15 14:30:00"

// Check if today
isToday(parseISO('2024-03-15T14:30:00Z')); // true/false

// Date calculations
addDays(new Date(), 7); // 7 days from now
```

### Drag and Drop

**@dnd-kit/core (Desktop) + React Native Gesture Handler (Mobile)**

```typescript
Rationale:
✅ Accessible keyboard support
✅ Touch-friendly
✅ Flexible API
✅ Good performance with virtualization
✅ TypeScript support

Example:
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

const TaskBoard = () => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Reorder or move entry
      reorderEntry(active.id, over.id);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={entries}>
        {entries.map(entry => (
          <DraggableEntry key={entry.id} entry={entry} />
        ))}
      </SortableContext>
    </DndContext>
  );
};
```

### Real-time Communication

**Native WebSocket API + useWebSocket Hook**

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (calendarId: string) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    ws.current = new WebSocket(
      `ws://localhost:8000/ws/calendar/${calendarId}?token=${token}`
    );

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Attempt reconnection
      setTimeout(() => {
        // Reconnect logic
      }, 3000);
    };

    return () => {
      ws.current?.close();
    };
  }, [calendarId]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, sendMessage };
};
```

---

## 📁 Project Structure

### Web (Next.js)

```
packages/web/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Auth group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/           # Main app group
│   │   ├── calendar/
│   │   ├── entries/
│   │   └── tasks/
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
│
├── components/               # React components
│   ├── ui/                  # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── calendar/            # Calendar-specific
│   │   ├── MonthView.tsx
│   │   ├── WeekView.tsx
│   │   ├── DayView.tsx
│   │   └── CalendarGrid.tsx
│   ├── entries/             # Entry-specific
│   │   ├── EntryList.tsx
│   │   ├── EntryCard.tsx
│   │   ├── EntryDetail.tsx
│   │   └── QuickAdd.tsx
│   ├── tasks/               # Task-specific
│   │   ├── TaskBoard.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskProgress.tsx
│   └── shared/              # Shared components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── LoadingSpinner.tsx
│
├── lib/                     # Utilities
│   ├── api/                # API client
│   │   ├── client.ts
│   │   ├── entries.ts
│   │   ├── tasks.ts
│   │   └── auth.ts
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useEntries.ts
│   │   ├── useTasks.ts
│   │   └── useWebSocket.ts
│   ├── stores/             # Zustand stores
│   │   ├── authStore.ts
│   │   ├── entryStore.ts
│   │   ├── taskStore.ts
│   │   └── uiStore.ts
│   ├── utils/              # Helper functions
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   └── format.ts
│   └── constants/          # Constants
│       ├── routes.ts
│       └── config.ts
│
├── types/                  # TypeScript types
│   ├── entry.ts
│   ├── task.ts
│   ├── calendar.ts
│   └── api.ts
│
├── styles/                # Global styles
│   └── globals.css
│
├── public/               # Static assets
│   ├── images/
│   └── icons/
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Mobile (React Native + Expo)

```
packages/mobile/
├── app/                    # Expo Router
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/            # Bottom tabs
│   │   ├── calendar.tsx
│   │   ├── entries.tsx
│   │   └── tasks.tsx
│   ├── _layout.tsx
│   └── index.tsx
│
├── components/            # React Native components
│   ├── calendar/
│   ├── entries/
│   ├── tasks/
│   └── shared/
│
├── hooks/                # Same as web (imported from shared)
├── stores/               # Same as web (imported from shared)
├── lib/                  # Mobile-specific utilities
│   ├── gestures.ts
│   └── haptics.ts
│
├── app.json
├── tsconfig.json
└── package.json
```

### Shared Package

```
packages/shared/
├── src/
│   ├── types/           # Shared TypeScript types
│   │   ├── entry.ts
│   │   ├── task.ts
│   │   └── api.ts
│   │
│   ├── api/            # API client (works for web & mobile)
│   │   ├── client.ts
│   │   ├── entries.ts
│   │   ├── tasks.ts
│   │   └── auth.ts
│   │
│   ├── utils/          # Shared utilities
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   └── format.ts
│   │
│   ├── constants/      # Shared constants
│   │   └── config.ts
│   │
│   └── hooks/          # Shared business logic hooks
│       ├── useEntries.ts
│       ├── useTasks.ts
│       └── useWebSocket.ts
│
├── tsconfig.json
└── package.json
```

---

## 🔌 API Integration Architecture

### API Client Design

```typescript
// packages/shared/src/api/client.ts
import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 - token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            this.handleLogout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    // Different storage for web vs mobile
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    } else {
      // Mobile: use AsyncStorage
      return null; // Handled by mobile-specific code
    }
  }

  private async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refresh_token: refreshToken,
      });
      const newToken = response.data.access_token;
      this.setToken(newToken);
      return newToken;
    })();

    try {
      return await this.tokenRefreshPromise;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private handleLogout() {
    // Clear tokens and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  }

  // Public API methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
);
```

### Entry API Module

```typescript
// packages/shared/src/api/entries.ts
import { apiClient } from './client';
import type { Entry, CreateEntryDTO, UpdateEntryDTO } from '../types/entry';

export const entriesApi = {
  // Get all entries for a calendar
  getEntries: (calendarId: string, params?: {
    has_timestamp?: boolean;
    start_date?: string;
    end_date?: string;
    entry_type?: string;
    is_completed?: boolean;
    task_id?: string;
  }) => {
    return apiClient.get<Entry[]>('/entries', {
      calendar_id: calendarId,
      ...params,
    });
  },

  // Get single entry
  getEntry: (id: string) => {
    return apiClient.get<Entry>(`/entries/${id}`);
  },

  // Create entry
  createEntry: (data: CreateEntryDTO) => {
    return apiClient.post<Entry>('/entries', data);
  },

  // Update entry
  updateEntry: (id: string, data: UpdateEntryDTO) => {
    return apiClient.patch<Entry>(`/entries/${id}`, data);
  },

  // Delete entry
  deleteEntry: (id: string) => {
    return apiClient.delete(`/entries/${id}`);
  },

  // Toggle completion
  toggleComplete: (id: string) => {
    return apiClient.post<Entry>(`/entries/${id}/complete`);
  },

  // Add to task
  addToTask: (id: string, taskId: string) => {
    return apiClient.post<Entry>(`/entries/${id}/add-to-task`, {
      task_id: taskId,
    });
  },

  // Remove from task
  removeFromTask: (id: string) => {
    return apiClient.post<Entry>(`/entries/${id}/remove-from-task`);
  },

  // Batch operations
  batchUpdate: (ids: string[], updates: Partial<Entry>) => {
    return apiClient.post<Entry[]>('/entries/batch-update', {
      ids,
      updates,
    });
  },

  batchDelete: (ids: string[]) => {
    return apiClient.post('/entries/batch-delete', { ids });
  },
};
```

### Task API Module

```typescript
// packages/shared/src/api/tasks.ts
import { apiClient } from './client';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '../types/task';

export const tasksApi = {
  // Get all tasks
  getTasks: (calendarId: string, params?: {
    status?: 'active' | 'completed' | 'archived';
  }) => {
    return apiClient.get<Task[]>('/tasks', {
      calendar_id: calendarId,
      ...params,
    });
  },

  // Get single task with entries
  getTask: (id: string) => {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  // Create task
  createTask: (data: CreateTaskDTO) => {
    return apiClient.post<Task>('/tasks', data);
  },

  // Update task
  updateTask: (id: string, data: UpdateTaskDTO) => {
    return apiClient.patch<Task>(`/tasks/${id}`, data);
  },

  // Delete task
  deleteTask: (id: string) => {
    return apiClient.delete(`/tasks/${id}`);
  },

  // Reorder entries in task
  reorderEntries: (taskId: string, entryIds: string[]) => {
    return apiClient.post(`/tasks/${taskId}/reorder`, {
      entry_ids: entryIds,
    });
  },
};
```

---

## 🏪 State Management Architecture

### Store Organization

```typescript
// lib/stores/entryStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Entry } from '@/types/entry';

interface EntryStore {
  // State
  entries: Entry[];
  selectedEntry: Entry | null;
  filters: EntryFilters;
  sortBy: SortOption;
  
  // Computed state
  unscheduledEntries: () => Entry[];
  scheduledEntries: () => Entry[];
  completedEntries: () => Entry[];
  
  // Actions
  setEntries: (entries: Entry[]) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  selectEntry: (entry: Entry | null) => void;
  setFilters: (filters: Partial<EntryFilters>) => void;
  setSortBy: (sortBy: SortOption) => void;
  clearFilters: () => void;
  
  // WebSocket sync
  syncFromWebSocket: (message: WebSocketMessage) => void;
}

export const useEntryStore = create<EntryStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        entries: [],
        selectedEntry: null,
        filters: {},
        sortBy: 'created_at',

        // Computed state
        unscheduledEntries: () => {
          return get().entries.filter(e => !e.timestamp);
        },
        
        scheduledEntries: () => {
          return get().entries.filter(e => e.timestamp);
        },
        
        completedEntries: () => {
          return get().entries.filter(e => e.is_completed);
        },

        // Actions
        setEntries: (entries) => set({ entries }),
        
        addEntry: (entry) => set((state) => ({
          entries: [...state.entries, entry],
        })),
        
        updateEntry: (id, updates) => set((state) => ({
          entries: state.entries.map(e =>
            e.id === id ? { ...e, ...updates } : e
          ),
          selectedEntry: state.selectedEntry?.id === id
            ? { ...state.selectedEntry, ...updates }
            : state.selectedEntry,
        })),
        
        deleteEntry: (id) => set((state) => ({
          entries: state.entries.filter(e => e.id !== id),
          selectedEntry: state.selectedEntry?.id === id
            ? null
            : state.selectedEntry,
        })),
        
        selectEntry: (entry) => set({ selectedEntry: entry }),
        
        setFilters: (filters) => set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
        
        setSortBy: (sortBy) => set({ sortBy }),
        
        clearFilters: () => set({ filters: {} }),

        // WebSocket sync
        syncFromWebSocket: (message) => {
          const { type, data } = message;
          
          switch (type) {
            case 'entry:created':
              get().addEntry(data);
              break;
            case 'entry:updated':
              get().updateEntry(data.id, data);
              break;
            case 'entry:deleted':
              get().deleteEntry(data.id);
              break;
          }
        },
      }),
      {
        name: 'entry-storage',
        partialize: (state) => ({
          filters: state.filters,
          sortBy: state.sortBy,
        }),
      }
    )
  )
);
```

### UI State Store

```typescript
// lib/stores/uiStore.ts
import { create } from 'zustand';

type View = 'calendar' | 'entries' | 'tasks';
type CalendarView = 'month' | 'week' | 'day';

interface UIStore {
  // View state
  currentView: View;
  calendarView: CalendarView;
  selectedDate: Date;
  
  // Modal state
  isEntryModalOpen: boolean;
  isTaskModalOpen: boolean;
  
  // Sidebar state
  isSidebarOpen: boolean;
  
  // Loading state
  isLoading: boolean;
  loadingMessage: string;
  
  // Actions
  setView: (view: View) => void;
  setCalendarView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  openEntryModal: () => void;
  closeEntryModal: () => void;
  openTaskModal: () => void;
  closeTaskModal: () => void;
  toggleSidebar: () => void;
  setLoading: (isLoading: boolean, message?: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  currentView: 'calendar',
  calendarView: 'month',
  selectedDate: new Date(),
  isEntryModalOpen: false,
  isTaskModalOpen: false,
  isSidebarOpen: true,
  isLoading: false,
  loadingMessage: '',
  
  setView: (view) => set({ currentView: view }),
  setCalendarView: (view) => set({ calendarView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  openEntryModal: () => set({ isEntryModalOpen: true }),
  closeEntryModal: () => set({ isEntryModalOpen: false }),
  openTaskModal: () => set({ isTaskModalOpen: true }),
  closeTaskModal: () => set({ isTaskModalOpen: false }),
  toggleSidebar: () => set((state) => ({ 
    isSidebarOpen: !state.isSidebarOpen 
  })),
  setLoading: (isLoading, message = '') => set({ 
    isLoading, 
    loadingMessage: message 
  }),
}));
```

---

## 🎨 Component Architecture

### Atomic Design Pattern

```
Atoms (基礎元件)
├── Button
├── Input
├── Checkbox
├── Badge
└── Icon

Molecules (組合元件)
├── EntryCard
├── DatePicker
├── SearchBar
└── FilterButton

Organisms (複雜組件)
├── EntryList
├── CalendarGrid
├── TaskBoard
└── Sidebar

Templates (佈局)
├── DashboardLayout
├── AuthLayout
└── MobileLayout

Pages (完整頁面)
├── CalendarPage
├── EntriesPage
└── TasksPage
```

### Example: EntryCard Component

```typescript
// components/entries/EntryCard.tsx
import { format } from 'date-fns';
import { Clock, CheckCircle, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Entry } from '@/types/entry';

interface EntryCardProps {
  entry: Entry;
  onToggleComplete?: (id: string) => void;
  onClick?: (entry: Entry) => void;
  draggable?: boolean;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onToggleComplete,
  onClick,
  draggable = false,
}) => {
  const hasTimestamp = !!entry.timestamp;
  
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        entry.is_completed && 'opacity-60',
        draggable && 'cursor-move'
      )}
      onClick={() => onClick?.(entry)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={entry.is_completed}
            onCheckedChange={() => onToggleComplete?.(entry.id)}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={cn(
              'font-medium truncate',
              entry.is_completed && 'line-through text-muted-foreground'
            )}>
              {entry.title}
            </h3>
            
            {/* Metadata */}
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {hasTimestamp && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(entry.timestamp), 'MMM d, h:mm a')}</span>
                </div>
              )}
              
              {entry.priority && (
                <Badge variant="outline" className={getPriorityColor(entry.priority)}>
                  {entry.priority}
                </Badge>
              )}
            </div>
            
            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Task indicator */}
            {entry.task && (
              <div className="mt-2 text-xs text-muted-foreground">
                Part of: <span className="font-medium">{entry.task.title}</span>
              </div>
            )}
          </div>
          
          {/* Completion indicator */}
          {entry.is_completed && (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'border-red-500 text-red-500';
    case 'medium':
      return 'border-yellow-500 text-yellow-500';
    case 'low':
      return 'border-blue-500 text-blue-500';
    default:
      return '';
  }
}
```

### Example: CalendarGrid Component

```typescript
// components/calendar/MonthView.tsx
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { useEntries } from '@/hooks/useEntries';
import { useUIStore } from '@/lib/stores/uiStore';
import { EntryCard } from '@/components/entries/EntryCard';

export const MonthView: React.FC = () => {
  const selectedDate = useUIStore((state) => state.selectedDate);
  const { entries } = useEntries();

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    if (entry.timestamp) {
      const dateKey = format(new Date(entry.timestamp), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
    }
    return acc;
  }, {} as Record<string, Entry[]>);

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="p-2 text-center font-medium text-sm">
          {day}
        </div>
      ))}

      {/* Calendar cells */}
      {daysInMonth.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayEntries = entriesByDate[dateKey] || [];
        const isCurrentMonth = isSameMonth(day, selectedDate);
        const isTodayDate = isToday(day);

        return (
          <div
            key={dateKey}
            className={cn(
              'min-h-[120px] p-2 border rounded-lg',
              !isCurrentMonth && 'bg-muted opacity-50',
              isTodayDate && 'bg-primary/10 border-primary'
            )}
          >
            {/* Date number */}
            <div className={cn(
              'text-sm font-medium mb-2',
              isTodayDate && 'text-primary'
            )}>
              {format(day, 'd')}
            </div>

            {/* Entries */}
            <div className="space-y-1">
              {dayEntries.slice(0, 3).map((entry) => (
                <EntryCard key={entry.id} entry={entry} compact />
              ))}
              
              {dayEntries.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{dayEntries.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

---

## 🚀 Performance Optimization Strategy

### 1. Code Splitting

```typescript
// Lazy load views
const CalendarView = lazy(() => import('@/components/calendar/CalendarView'));
const EntriesView = lazy(() => import('@/components/entries/EntriesView'));
const TasksView = lazy(() => import('@/components/tasks/TasksView'));

// Route-based splitting (Next.js does this automatically)
export default function CalendarPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CalendarView />
    </Suspense>
  );
}
```

### 2. Virtual Scrolling

```typescript
// For large entry lists (1000+ items)
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualEntryList: React.FC<{ entries: Entry[] }> = ({ entries }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each item
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const entry = entries[virtualItem.index];
          return (
            <div
              key={entry.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <EntryCard entry={entry} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### 3. Optimistic Updates

```typescript
// hooks/useOptimisticEntry.ts
export const useOptimisticEntry = () => {
  const queryClient = useQueryClient();

  const createEntry = useMutation({
    mutationFn: entriesApi.createEntry,
    
    onMutate: async (newEntry) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['entries'] });

      // Snapshot previous value
      const previousEntries = queryClient.getQueryData(['entries']);

      // Optimistically update
      queryClient.setQueryData(['entries'], (old: Entry[]) => [
        ...old,
        { ...newEntry, id: `temp-${Date.now()}`, optimistic: true },
      ]);

      return { previousEntries };
    },
    
    onError: (err, newEntry, context) => {
      // Rollback on error
      queryClient.setQueryData(['entries'], context.previousEntries);
      toast.error('Failed to create entry');
    },
    
    onSuccess: (data) => {
      // Replace optimistic entry with real one
      queryClient.setQueryData(['entries'], (old: Entry[]) =>
        old.map(e => e.optimistic ? data : e)
      );
    },
  });

  return { createEntry };
};
```

### 4. Memoization

```typescript
// Expensive calculations
const sortedEntries = useMemo(() => {
  return entries.sort((a, b) => {
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // Other sort logic
  });
}, [entries, sortBy]);

// Expensive components
const MemoizedEntryCard = memo(EntryCard, (prev, next) => {
  return (
    prev.entry.id === next.entry.id &&
    prev.entry.is_completed === next.entry.is_completed &&
    prev.entry.timestamp === next.entry.timestamp
  );
});
```

### 5. Image Optimization

```typescript
// Next.js Image component
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  alt="User avatar"
  width={40}
  height={40}
  quality={75}
  loading="lazy"
  placeholder="blur"
/>
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

```typescript
// components/entries/EntryCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EntryCard } from './EntryCard';

describe('EntryCard', () => {
  const mockEntry = {
    id: '1',
    title: 'Test Entry',
    is_completed: false,
    timestamp: '2024-03-15T10:00:00Z',
  };

  it('renders entry title', () => {
    render(<EntryCard entry={mockEntry} />);
    expect(screen.getByText('Test Entry')).toBeInTheDocument();
  });

  it('calls onToggleComplete when checkbox clicked', () => {
    const onToggleComplete = vi.fn();
    render(
      <EntryCard entry={mockEntry} onToggleComplete={onToggleComplete} />
    );
    
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggleComplete).toHaveBeenCalledWith('1');
  });

  it('shows timestamp when present', () => {
    render(<EntryCard entry={mockEntry} />);
    expect(screen.getByText(/Mar 15/)).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// __tests__/entry-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { EntriesView } from '@/components/entries/EntriesView';

describe('Entry Creation Flow', () => {
  it('creates a new entry', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <EntriesView />
      </QueryClientProvider>
    );

    // Type in quick add
    const input = screen.getByPlaceholderText('Add new entry...');
    await user.type(input, 'New task');
    await user.keyboard('{Enter}');

    // Verify entry appears
    await waitFor(() => {
      expect(screen.getByText('New task')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/calendar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
  });

  test('displays current month', async ({ page }) => {
    const monthYear = await page.textContent('h1');
    expect(monthYear).toContain(new Date().getFullYear().toString());
  });

  test('creates entry by double-clicking date', async ({ page }) => {
    // Double-click on a date cell
    await page.dblclick('[data-date="2024-03-15"]');

    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill form
    await page.fill('[name="title"]', 'Meeting');
    await page.click('button[type="submit"]');

    // Entry should appear
    await expect(page.locator('text=Meeting')).toBeVisible();
  });
});
```

---

## 🔐 Security Considerations

### 1. XSS Prevention

```typescript
// Always sanitize user input
import DOMPurify from 'dompurify';

const SafeContent: React.FC<{ html: string }> = ({ html }) => {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
  
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
};
```

### 2. CSRF Protection

```typescript
// Include CSRF token in requests
const apiClient = axios.create({
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});
```

### 3. Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' wss://;
    `.replace(/\s{2,}/g, ' ').trim()
  },
];
```

### 4. Sensitive Data Handling

```typescript
// Never log sensitive data
const sanitizeForLogging = (obj: any) => {
  const { password, token, ...safe } = obj;
  return safe;
};

console.log('User data:', sanitizeForLogging(userData));
```

---

## 📱 Responsive Design Implementation

### Breakpoints

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Extra large
    },
  },
};

// Usage
<div className="
  w-full           // Mobile: full width
  md:w-1/2         // Tablet: half width
  lg:w-1/3         // Desktop: third width
">
```

### Mobile-First Approach

```typescript
// components/layout/ResponsiveLayout.tsx
export const ResponsiveLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <>
      {/* Mobile: Bottom nav */}
      {isMobile && <MobileBottomNav />}
      
      {/* Desktop: Sidebar */}
      {!isMobile && <Sidebar />}
      
      <main className="
        px-4 py-2          // Mobile: small padding
        md:px-6 md:py-4    // Tablet: medium padding
        lg:px-8 lg:py-6    // Desktop: large padding
      ">
        {children}
      </main>
    </>
  );
};
```

---

## 🔄 Real-time Sync Architecture

### WebSocket Event Flow

```
Client                  WebSocket Server              Backend
  │                           │                          │
  │─── Connect ──────────────>│                          │
  │<── Connected ─────────────│                          │
  │                           │                          │
  │─── Create Entry ─────────>│─────── API Call ───────>│
  │                           │<──── Entry Created ─────│
  │                           │                          │
  │<── Broadcast ─────────────│                          │
  │   (entry:created)         │                          │
  │                           │                          │
  │                           │─── Broadcast to others ─>│
  │                           │                          │
```

### Conflict Resolution

```typescript
// optimistic-sync.ts
export const resolveConflict = (
  local: Entry,
  remote: Entry
): Entry => {
  // Server wins for now (simple strategy)
  // TODO: Implement CRDT for better conflict resolution
  
  if (remote.updated_at > local.updated_at) {
    return remote;
  }
  
  return local;
};

// In WebSocket handler
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  
  if (type === 'entry:updated') {
    const localEntry = getLocalEntry(data.id);
    
    if (localEntry && localEntry.updated_at > data.updated_at) {
      // Local is newer, send to server
      sendUpdate(localEntry);
    } else {
      // Remote is newer, update local
      updateLocalEntry(data);
    }
  }
};
```

---

## 📦 Build and Deployment

### Build Configuration

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "test": "vitest",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit"
  }
}
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_ENV=development
```

### Docker Build

```dockerfile
# Dockerfile (Next.js)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
```

---

## ✅ Frontend PLAN Sign-Off

**This plan is complete when:**
- ✅ Technology stack is fully defined
- ✅ Architecture patterns are documented
- ✅ API integration strategy is clear
- ✅ Component structure is designed
- ✅ State management approach is decided
- ✅ Performance optimizations are planned
- ✅ Testing strategy is outlined
- ✅ Security measures are considered

**Reviewers:**
- [ ] Frontend Architect: _______________________
- [ ] Tech Lead: _______________________
- [ ] Security Engineer: _______________________
- [ ] DevOps Engineer: _______________________

**Approval Date:** _______________________

---

**Next Phase:** Move to Frontend TASKS phase (03_TASKS_FRONTEND.md) for implementation breakdown.

**Estimated Implementation Time:** 6-8 weeks (with 2 frontend developers)
