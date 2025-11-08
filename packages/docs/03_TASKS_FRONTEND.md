# Phase 3: TASKS (Frontend)
# Calendar + Task Management System - Frontend Implementation Tasks

**Version:** 1.0  
**Last Updated:** 2024-11-09  
**Status:** Ready for Implementation  
**Based on:** 01_SPECIFY_FRONTEND.md v1.0 + 02_PLAN_FRONTEND.md v1.0

---

## 📋 Task Breakdown Overview

This document breaks down the entire frontend project into actionable tasks. Each task is:
- **Small:** Can be completed in 0.5-2 days
- **Testable:** Has clear acceptance criteria
- **Independent:** Can be worked on with minimal blocking
- **Documented:** Includes context and technical guidance

---

## 🏛️ Project Structure

```
Epics (High-level features)
└── Stories (User-facing functionality)
    └── Tasks (Specific implementation work)
```

**Total Epics:** 7  
**Total Stories:** 28  
**Total Tasks:** 82  
**Estimated Duration:** 8 weeks (with 2 frontend developers)

---

## 📊 Epic Overview

| Epic | Description | Stories | Tasks | Est. Time |
|------|-------------|---------|-------|-----------|
| E1 | Frontend Setup | 3 | 10 | 4 days |
| E2 | Authentication UI | 3 | 8 | 5 days |
| E3 | Calendar View | 5 | 18 | 10 days |
| E4 | Entry Management UI | 5 | 15 | 8 days |
| E5 | Task Management UI | 4 | 12 | 7 days |
| E6 | Real-time Sync & Polish | 4 | 10 | 6 days |
| E7 | Mobile App | 4 | 9 | 8 days |

---

## 🎯 EPIC 1: Frontend Setup & Infrastructure

**Goal:** Set up Next.js project, shared packages, and development environment

### Story 1.1: Project Initialization

**As a** developer  
**I want** a properly configured Next.js project with TypeScript  
**So that** I can start building components

#### Task 1.1.1: Initialize Next.js Project

**Description:** Create Next.js 14 project with App Router and TypeScript

**Technical Guidance:**
```bash
# Create Next.js app
npx create-next-app@latest packages/web --typescript --tailwind --app --src-dir

# Project structure
packages/web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── public/
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

**Implementation Steps:**
1. Run create-next-app with proper flags
2. Configure tsconfig.json with path aliases
3. Set up Tailwind CSS with custom config
4. Create base layout component
5. Test that dev server runs

**Acceptance Criteria:**
- [ ] `npm run dev` starts server on port 3000
- [ ] TypeScript compilation works
- [ ] Tailwind CSS is properly configured
- [ ] Path aliases work (@/components, @/lib, etc.)
- [ ] Hot reload works

**Dependencies:** None  
**Estimated Time:** 2 hours  
**Priority:** P0 (Blocker)

---

#### Task 1.1.2: Setup Shared Package

**Description:** Create shared package for code reuse between web and mobile

**Directory Structure:**
```
packages/shared/
├── src/
│   ├── types/
│   │   ├── entry.ts
│   │   ├── task.ts
│   │   ├── calendar.ts
│   │   └── api.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── entries.ts
│   │   ├── tasks.ts
│   │   └── auth.ts
│   ├── utils/
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   └── format.ts
│   └── constants/
│       └── config.ts
├── package.json
└── tsconfig.json
```

**Key Files to Create:**

```typescript
// packages/shared/src/types/entry.ts
export interface Entry {
  id: string;
  calendar_id: string;
  title: string;
  content?: string;
  entry_type: 'event' | 'note' | 'reminder';
  timestamp?: string;
  end_timestamp?: string;
  is_completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  task_id?: string;
  task?: Task;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryDTO {
  calendar_id: string;
  title: string;
  content?: string;
  entry_type?: 'event' | 'note' | 'reminder';
  timestamp?: string;
  end_timestamp?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  task_id?: string;
}

export interface UpdateEntryDTO extends Partial<CreateEntryDTO> {}
```

```typescript
// packages/shared/src/types/task.ts
export interface Task {
  id: string;
  calendar_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'active' | 'completed' | 'archived' | 'cancelled';
  completed_at?: string;
  total_entries: number;
  completed_entries: number;
  completion_percentage: number;
  color?: string;
  icon?: string;
  position: number;
  entries?: Entry[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskDTO {
  calendar_id: string;
  title: string;
  description?: string;
  due_date?: string;
  color?: string;
  icon?: string;
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {}
```

```typescript
// packages/shared/src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

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
    // Request interceptor
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

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh
          const newToken = await this.refreshToken();
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return this.client(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private async refreshToken(): Promise<string | null> {
    // Implement token refresh logic
    return null;
  }

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

export const createApiClient = (baseURL: string) => new ApiClient(baseURL);
```

**Acceptance Criteria:**
- [ ] Shared package builds successfully
- [ ] Types are properly exported
- [ ] API client can be imported in web package
- [ ] No circular dependencies
- [ ] TypeScript types work across packages

**Dependencies:** Task 1.1.1  
**Estimated Time:** 3 hours  
**Priority:** P0

---

#### Task 1.1.3: Install Core Dependencies

**Description:** Install and configure all necessary npm packages

**Dependencies to Install:**
```bash
# State Management
npm install zustand@4.4.7
npm install @tanstack/react-query@5.17.0

# UI Components
npm install @radix-ui/react-dialog@1.0.5
npm install @radix-ui/react-dropdown-menu@2.0.6
npm install @radix-ui/react-checkbox@1.0.4
npm install class-variance-authority@0.7.0
npm install clsx@2.1.0
npm install tailwind-merge@2.2.0

# Date Handling
npm install date-fns@3.2.0

# Drag and Drop
npm install @dnd-kit/core@6.1.0
npm install @dnd-kit/sortable@8.0.0

# Icons
npm install lucide-react@0.309.0

# Forms
npm install react-hook-form@7.49.3
npm install zod@3.22.4
npm install @hookform/resolvers@3.3.4

# HTTP Client
npm install axios@1.6.5

# Dev Dependencies
npm install -D @types/node
npm install -D eslint-config-next
npm install -D prettier
npm install -D prettier-plugin-tailwindcss
```

**Acceptance Criteria:**
- [ ] All packages install without errors
- [ ] No version conflicts
- [ ] TypeScript types are available
- [ ] Package.json has all dependencies listed

**Dependencies:** Task 1.1.1  
**Estimated Time:** 1 hour  
**Priority:** P0

---

#### Task 1.1.4: Setup shadcn/ui

**Description:** Initialize shadcn/ui and add base components

**Implementation:**
```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add base components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add toast
```

**Files Created:**
```
components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── checkbox.tsx
│   ├── select.tsx
│   ├── badge.tsx
│   ├── dropdown-menu.tsx
│   ├── calendar.tsx
│   ├── popover.tsx
│   └── toast.tsx
└── providers.tsx
```

**Acceptance Criteria:**
- [ ] shadcn/ui is initialized
- [ ] All base components are added
- [ ] Components work with Tailwind
- [ ] Theme customization works
- [ ] Example usage renders correctly

**Dependencies:** Task 1.1.3  
**Estimated Time:** 2 hours  
**Priority:** P0

---

### Story 1.2: State Management Setup

**As a** developer  
**I want** properly configured state management  
**So that** I can manage app state efficiently

#### Task 1.2.1: Create Zustand Stores

**Description:** Set up Zustand stores for entry, task, and UI state

**Entry Store:**
```typescript
// lib/stores/entryStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Entry } from '@/types/entry';

interface EntryFilters {
  entry_type?: string;
  is_completed?: boolean;
  has_timestamp?: boolean;
  task_id?: string;
  tags?: string[];
}

type SortOption = 'created_at' | 'updated_at' | 'timestamp' | 'title' | 'priority';

interface EntryStore {
  entries: Entry[];
  selectedEntry: Entry | null;
  filters: EntryFilters;
  sortBy: SortOption;
  
  // Computed
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
}

export const useEntryStore = create<EntryStore>()(
  devtools(
    persist(
      (set, get) => ({
        entries: [],
        selectedEntry: null,
        filters: {},
        sortBy: 'created_at',

        unscheduledEntries: () => get().entries.filter(e => !e.timestamp),
        scheduledEntries: () => get().entries.filter(e => e.timestamp),
        completedEntries: () => get().entries.filter(e => e.is_completed),

        setEntries: (entries) => set({ entries }),
        addEntry: (entry) => set((state) => ({ 
          entries: [...state.entries, entry] 
        })),
        updateEntry: (id, updates) => set((state) => ({
          entries: state.entries.map(e => e.id === id ? { ...e, ...updates } : e),
          selectedEntry: state.selectedEntry?.id === id 
            ? { ...state.selectedEntry, ...updates } 
            : state.selectedEntry
        })),
        deleteEntry: (id) => set((state) => ({
          entries: state.entries.filter(e => e.id !== id),
          selectedEntry: state.selectedEntry?.id === id ? null : state.selectedEntry
        })),
        selectEntry: (entry) => set({ selectedEntry: entry }),
        setFilters: (filters) => set((state) => ({ 
          filters: { ...state.filters, ...filters } 
        })),
        setSortBy: (sortBy) => set({ sortBy }),
        clearFilters: () => set({ filters: {} }),
      }),
      { name: 'entry-storage' }
    )
  )
);
```

**Task Store:**
```typescript
// lib/stores/taskStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Task } from '@/types/task';

interface TaskStore {
  tasks: Task[];
  selectedTask: Task | null;
  expandedTaskIds: Set<string>;
  
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  selectTask: (task: Task | null) => void;
  toggleTaskExpanded: (id: string) => void;
}

export const useTaskStore = create<TaskStore>()(
  devtools((set) => ({
    tasks: [],
    selectedTask: null,
    expandedTaskIds: new Set(),

    setTasks: (tasks) => set({ tasks }),
    addTask: (task) => set((state) => ({ 
      tasks: [...state.tasks, task] 
    })),
    updateTask: (id, updates) => set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
      selectedTask: state.selectedTask?.id === id 
        ? { ...state.selectedTask, ...updates } 
        : state.selectedTask
    })),
    deleteTask: (id) => set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id),
      selectedTask: state.selectedTask?.id === id ? null : state.selectedTask
    })),
    selectTask: (task) => set({ selectedTask: task }),
    toggleTaskExpanded: (id) => set((state) => {
      const newSet = new Set(state.expandedTaskIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { expandedTaskIds: newSet };
    }),
  }))
);
```

**UI Store:**
```typescript
// lib/stores/uiStore.ts
import { create } from 'zustand';

type View = 'calendar' | 'entries' | 'tasks';
type CalendarView = 'month' | 'week' | 'day';

interface UIStore {
  currentView: View;
  calendarView: CalendarView;
  selectedDate: Date;
  isEntryModalOpen: boolean;
  isTaskModalOpen: boolean;
  isSidebarOpen: boolean;
  isLoading: boolean;
  loadingMessage: string;
  
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
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message }),
}));
```

**Acceptance Criteria:**
- [ ] All three stores are created
- [ ] TypeScript types are correct
- [ ] DevTools integration works
- [ ] Persistence works for entry store
- [ ] Stores can be imported and used in components

**Dependencies:** Task 1.1.3  
**Estimated Time:** 3 hours  
**Priority:** P0

---

#### Task 1.2.2: Setup React Query

**Description:** Configure TanStack Query for server state management

**Implementation:**
```typescript
// lib/queryClient.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

// app/providers.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Query Hooks:**
```typescript
// hooks/useEntries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entriesApi } from '@/lib/api/entries';
import type { Entry, CreateEntryDTO, UpdateEntryDTO } from '@/types/entry';

export const useEntries = (calendarId: string, filters?: any) => {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['entries', calendarId, filters],
    queryFn: () => entriesApi.getEntries(calendarId, filters),
    enabled: !!calendarId,
  });

  const createEntry = useMutation({
    mutationFn: (data: CreateEntryDTO) => entriesApi.createEntry(data),
    onSuccess: (newEntry) => {
      queryClient.setQueryData<Entry[]>(
        ['entries', calendarId],
        (old = []) => [...old, newEntry]
      );
    },
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntryDTO }) =>
      entriesApi.updateEntry(id, data),
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData<Entry[]>(
        ['entries', calendarId],
        (old = []) => old.map(e => e.id === updatedEntry.id ? updatedEntry : e)
      );
    },
  });

  const deleteEntry = useMutation({
    mutationFn: (id: string) => entriesApi.deleteEntry(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Entry[]>(
        ['entries', calendarId],
        (old = []) => old.filter(e => e.id !== id)
      );
    },
  });

  return { 
    entries, 
    isLoading, 
    error, 
    createEntry, 
    updateEntry, 
    deleteEntry 
  };
};
```

**Acceptance Criteria:**
- [ ] React Query is configured
- [ ] Query client is set up with defaults
- [ ] DevTools are available in dev mode
- [ ] Example query hook works
- [ ] Provider wraps the app

**Dependencies:** Task 1.2.1  
**Estimated Time:** 2 hours  
**Priority:** P0

---

### Story 1.3: Layout & Navigation

**As a** user  
**I want** consistent navigation across the app  
**So that** I can easily switch between views

#### Task 1.3.1: Create Root Layout

**Description:** Build the main app layout with header and sidebar

**Component:**
```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Calendar App',
  description: 'Calendar and Task Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

// app/(dashboard)/layout.tsx
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Header Component:**
```typescript
// components/layout/Header.tsx
'use client';

import { Search, Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header: React.FC = () => {
  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entries, tasks..."
            className="pl-10"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
```

**Sidebar Component:**
```typescript
// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, List, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/uiStore';

const navItems = [
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/entries', icon: List, label: 'Entries' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 border-r bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>

      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
```

**Acceptance Criteria:**
- [ ] Root layout renders correctly
- [ ] Dashboard layout has header and sidebar
- [ ] Header shows search and user menu
- [ ] Sidebar navigation works
- [ ] Active route is highlighted
- [ ] Layout is responsive

**Dependencies:** Task 1.1.4  
**Estimated Time:** 4 hours  
**Priority:** P0

---

## 🎯 EPIC 2: Authentication UI

**Goal:** Build login, register, and authentication flows

### Story 2.1: Login Page

**As a** user  
**I want** to log in to my account  
**So that** I can access my calendar and tasks

#### Task 2.1.1: Create Login Form

**Description:** Build login page with email/password form

**Component:**
```typescript
// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data.email, data.password);
      router.push('/calendar');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Auth Hook:**
```typescript
// hooks/useAuth.ts
import { useState } from 'react';
import { authApi } from '@/lib/api/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('auth_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    setUser(response.user);
  };

  const register = async (email: string, username: string, password: string) => {
    const response = await authApi.register({ email, username, password });
    localStorage.setItem('auth_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return { user, login, register, logout };
};
```

**Acceptance Criteria:**
- [ ] Login form renders correctly
- [ ] Form validation works
- [ ] Successful login redirects to /calendar
- [ ] Errors are displayed
- [ ] Loading state shows during submit
- [ ] Token is stored in localStorage

**Dependencies:** Task 1.3.1  
**Estimated Time:** 3 hours  
**Priority:** P0

---

## 🎯 EPIC 3: Calendar View

**Goal:** Build all three calendar view modes (Month, Week, Day)

### Story 3.1: Month View

**As a** user  
**I want** to see my entries in a monthly calendar  
**So that** I can get an overview of my schedule

#### Task 3.1.1: Create Month View Grid

**Description:** Build the monthly calendar grid with date cells

**Component:**
```typescript
// components/calendar/MonthView.tsx
'use client';

import { useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/uiStore';
import { useEntries } from '@/hooks/useEntries';
import { EntryCard } from '@/components/entries/EntryCard';

export const MonthView: React.FC = () => {
  const selectedDate = useUIStore((state) => state.selectedDate);
  const { entries } = useEntries('calendar-id-here'); // TODO: Get from context

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry[]>();
    entries.forEach(entry => {
      if (entry.timestamp) {
        const dateKey = format(new Date(entry.timestamp), 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(entry);
      }
    });
    return map;
  }, [entries]);

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: '1fr' }}>
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEntries = entriesByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <div
              key={dateKey}
              className={cn(
                'border-b border-r p-2 min-h-[120px]',
                !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                isTodayDate && 'bg-primary/5'
              )}
              onDoubleClick={() => {
                // TODO: Open create entry modal with this date
              }}
            >
              {/* Date number */}
              <div className={cn(
                'text-sm font-medium mb-1',
                isTodayDate && 'flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground'
              )}>
                {format(day, 'd')}
              </div>

              {/* Entries */}
              <div className="space-y-1">
                {dayEntries.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'text-xs p-1 rounded truncate cursor-pointer',
                      entry.is_completed && 'opacity-60 line-through',
                      entry.priority === 'high' && 'bg-red-100 text-red-900',
                      entry.priority === 'medium' && 'bg-yellow-100 text-yellow-900',
                      entry.priority === 'low' && 'bg-blue-100 text-blue-900',
                      !entry.priority && 'bg-gray-100'
                    )}
                    onClick={() => {
                      // TODO: Open entry detail modal
                    }}
                  >
                    {entry.title}
                  </div>
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
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Calendar grid displays 7 columns (days of week)
- [ ] Shows 5-6 rows covering entire month
- [ ] Date numbers are visible
- [ ] Current month dates are prominent
- [ ] Other month dates are dimmed
- [ ] Today is highlighted
- [ ] Grid is responsive

**Dependencies:** Task 1.2.2, Task 1.3.1  
**Estimated Time:** 4 hours  
**Priority:** P0

---

#### Task 3.1.2: Display Entries in Month View

**Description:** Show entry cards in calendar cells

**Updates to MonthView:**
```typescript
// Add entry card component for calendar
// components/calendar/CalendarEntryCard.tsx
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import type { Entry } from '@/types/entry';

interface CalendarEntryCardProps {
  entry: Entry;
  onClick?: () => void;
}

export const CalendarEntryCard: React.FC<CalendarEntryCardProps> = ({
  entry,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'text-xs p-1.5 rounded cursor-pointer transition-colors hover:opacity-80',
        entry.is_completed && 'opacity-60',
        entry.priority === 'high' && 'bg-red-100 text-red-900 border-l-2 border-red-500',
        entry.priority === 'medium' && 'bg-yellow-100 text-yellow-900 border-l-2 border-yellow-500',
        entry.priority === 'low' && 'bg-blue-100 text-blue-900 border-l-2 border-blue-500',
        !entry.priority && 'bg-gray-100 border-l-2 border-gray-400'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        {entry.is_completed && <CheckCircle className="w-3 h-3" />}
        <span className={cn(
          'truncate flex-1',
          entry.is_completed && 'line-through'
        )}>
          {entry.title}
        </span>
      </div>
      {entry.timestamp && (
        <div className="text-[10px] opacity-70 mt-0.5">
          {format(new Date(entry.timestamp), 'h:mm a')}
        </div>
      )}
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Entries display in correct date cells
- [ ] Entry cards show title and time
- [ ] Completed entries are styled differently
- [ ] Priority is indicated by color
- [ ] Max 3 entries visible per cell
- [ ] "+N more" shown when more than 3 entries
- [ ] Click on entry opens detail modal

**Dependencies:** Task 3.1.1  
**Estimated Time:** 3 hours  
**Priority:** P0

---

#### Task 3.1.3: Month Navigation Controls

**Description:** Add previous/next month buttons and month selector

**Component:**
```typescript
// components/calendar/CalendarHeader.tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/stores/uiStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const CalendarHeader: React.FC = () => {
  const { selectedDate, setSelectedDate, calendarView, setCalendarView } = useUIStore();

  const goToPrevious = () => {
    if (calendarView === 'month') {
      setSelectedDate(subMonths(selectedDate, 1));
    }
    // TODO: Handle week and day views
  };

  const goToNext = () => {
    if (calendarView === 'month') {
      setSelectedDate(addMonths(selectedDate, 1));
    }
    // TODO: Handle week and day views
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Title and navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-xl font-semibold">
          {format(selectedDate, 'MMMM yyyy')}
        </h2>
      </div>

      {/* View selector */}
      <Select value={calendarView} onValueChange={(v: any) => setCalendarView(v)}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="day">Day</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] "Today" button resets to current date
- [ ] Previous/next buttons navigate months
- [ ] Current month/year is displayed
- [ ] View selector changes calendar mode
- [ ] Keyboard shortcuts work (left/right arrows)

**Dependencies:** Task 3.1.1  
**Estimated Time:** 2 hours  
**Priority:** P0

---

## 🎯 EPIC 4: Entry Management UI

**Goal:** Build entry list view and entry CRUD operations

### Story 4.1: Entry List View

**As a** user  
**I want** to see all my entries in a list  
**So that** I can manage them efficiently

#### Task 4.1.1: Create Entry List Component

**Description:** Build the main entry list with sections

**Component:**
```typescript
// app/(dashboard)/entries/page.tsx
'use client';

import { EntryList } from '@/components/entries/EntryList';
import { EntryListHeader } from '@/components/entries/EntryListHeader';
import { QuickAdd } from '@/components/entries/QuickAdd';

export default function EntriesPage() {
  return (
    <div className="flex flex-col h-full">
      <EntryListHeader />
      <QuickAdd />
      <EntryList />
    </div>
  );
}

// components/entries/EntryList.tsx
'use client';

import { useMemo } from 'react';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { useEntries } from '@/hooks/useEntries';
import { useEntryStore } from '@/lib/stores/entryStore';
import { EntryCard } from './EntryCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export const EntryList: React.FC = () => {
  const { entries, isLoading } = useEntries('calendar-id-here');
  const { filters, sortBy } = useEntryStore();

  const groupedEntries = useMemo(() => {
    // Filter entries
    let filtered = entries;
    
    if (filters.has_timestamp === false) {
      filtered = filtered.filter(e => !e.timestamp);
    }
    
    if (filters.is_completed !== undefined) {
      filtered = filtered.filter(e => e.is_completed === filters.is_completed);
    }

    // Group by sections
    const unscheduled = filtered.filter(e => !e.timestamp);
    const scheduled = filtered.filter(e => e.timestamp);

    const today = scheduled.filter(e => isToday(new Date(e.timestamp!)));
    const tomorrow = scheduled.filter(e => isTomorrow(new Date(e.timestamp!)));
    const thisWeek = scheduled.filter(e => 
      isThisWeek(new Date(e.timestamp!)) && 
      !isToday(new Date(e.timestamp!)) && 
      !isTomorrow(new Date(e.timestamp!))
    );
    const later = scheduled.filter(e => 
      !isThisWeek(new Date(e.timestamp!))
    );

    return { unscheduled, today, tomorrow, thisWeek, later };
  }, [entries, filters]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Unscheduled */}
      {groupedEntries.unscheduled.length > 0 && (
        <EntrySection
          title="📥 Unscheduled"
          count={groupedEntries.unscheduled.length}
          entries={groupedEntries.unscheduled}
        />
      )}

      {/* Today */}
      {groupedEntries.today.length > 0 && (
        <EntrySection
          title="📅 Today"
          count={groupedEntries.today.length}
          entries={groupedEntries.today}
          defaultOpen
        />
      )}

      {/* Tomorrow */}
      {groupedEntries.tomorrow.length > 0 && (
        <EntrySection
          title="📅 Tomorrow"
          count={groupedEntries.tomorrow.length}
          entries={groupedEntries.tomorrow}
        />
      )}

      {/* This Week */}
      {groupedEntries.thisWeek.length > 0 && (
        <EntrySection
          title="📅 This Week"
          count={groupedEntries.thisWeek.length}
          entries={groupedEntries.thisWeek}
        />
      )}

      {/* Later */}
      {groupedEntries.later.length > 0 && (
        <EntrySection
          title="📅 Later"
          count={groupedEntries.later.length}
          entries={groupedEntries.later}
        />
      )}
    </div>
  );
};

interface EntrySectionProps {
  title: string;
  count: number;
  entries: Entry[];
  defaultOpen?: boolean;
}

const EntrySection: React.FC<EntrySectionProps> = ({
  title,
  count,
  entries,
  defaultOpen = false,
}) => {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4" />
          <h3 className="font-medium">{title}</h3>
          <span className="text-sm text-muted-foreground">({count})</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 mt-2">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
```

**Acceptance Criteria:**
- [ ] Entries are grouped into sections
- [ ] Unscheduled entries show first
- [ ] Scheduled entries grouped by date
- [ ] Sections are collapsible
- [ ] Entry count shows in header
- [ ] "Today" section is open by default

**Dependencies:** Task 1.2.2  
**Estimated Time:** 5 hours  
**Priority:** P0

---

#### Task 4.1.2: Quick Add Input

**Description:** Build the quick entry creation input

**Component:**
```typescript
// components/entries/QuickAdd.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEntries } from '@/hooks/useEntries';
import { useToast } from '@/hooks/use-toast';

export const QuickAdd: React.FC = () => {
  const [title, setTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { createEntry } = useEntries('calendar-id-here');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    try {
      await createEntry.mutateAsync({
        calendar_id: 'calendar-id-here',
        title: title.trim(),
        entry_type: 'note',
      });

      setTitle('');
      setIsExpanded(false);
      
      toast({
        title: 'Entry created',
        description: 'Your entry has been added.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create entry.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Add new entry... (press Enter)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          className="flex-1"
        />
        
        {isExpanded && (
          <Button type="submit" disabled={!title.trim() || createEntry.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        )}
      </form>
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Input is always visible
- [ ] Pressing Enter creates entry
- [ ] Add button shows when focused
- [ ] Input clears after submit
- [ ] Loading state during creation
- [ ] Success toast shows
- [ ] Error toast shows on failure

**Dependencies:** Task 4.1.1  
**Estimated Time:** 2 hours  
**Priority:** P0

---

### Story 4.2: Entry Detail Modal

**As a** user  
**I want** to view and edit entry details  
**So that** I can manage my entries

#### Task 4.2.1: Create Entry Detail Dialog

**Description:** Build modal for viewing/editing entry details

**Component:**
```typescript
// components/entries/EntryDetailDialog.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Tag, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEntries } from '@/hooks/useEntries';
import type { Entry } from '@/types/entry';

interface EntryDetailDialogProps {
  entry: Entry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EntryDetailDialog: React.FC<EntryDetailDialogProps> = ({
  entry,
  open,
  onOpenChange,
}) => {
  const { updateEntry, deleteEntry } = useEntries('calendar-id-here');
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    content: entry?.content || '',
    entry_type: entry?.entry_type || 'note',
    priority: entry?.priority || undefined,
    timestamp: entry?.timestamp || '',
  });

  if (!entry) return null;

  const handleSave = async () => {
    await updateEntry.mutateAsync({
      id: entry.id,
      data: formData,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry.mutateAsync(entry.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Entry Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.entry_type}
              onValueChange={(value: any) => setFormData({ ...formData, entry_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timestamp */}
          <div className="space-y-2">
            <Label htmlFor="timestamp">Date & Time</Label>
            <Input
              id="timestamp"
              type="datetime-local"
              value={formData.timestamp ? format(new Date(formData.timestamp), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateEntry.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**Acceptance Criteria:**
- [ ] Dialog opens when entry clicked
- [ ] All entry fields are editable
- [ ] Save button updates entry
- [ ] Delete button removes entry
- [ ] Cancel button closes without saving
- [ ] Loading states during operations
- [ ] Confirmation before delete

**Dependencies:** Task 4.1.1  
**Estimated Time:** 4 hours  
**Priority:** P0

---

## 🎯 EPIC 5: Task Management UI

**Goal:** Build task board view and task operations

### Story 5.1: Task Board View

**As a** user  
**I want** to see my tasks and their progress  
**So that** I can track project completion

#### Task 5.1.1: Create Task Board Component

**Description:** Build the main task board with task cards

**Component:**
```typescript
// app/(dashboard)/tasks/page.tsx
'use client';

import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskHeader } from '@/components/tasks/TaskHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useUIStore } from '@/lib/stores/uiStore';

export default function TasksPage() {
  const openTaskModal = useUIStore((state) => state.openTaskModal);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={openTaskModal}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>
      
      <TaskBoard />
    </div>
  );
}

// components/tasks/TaskBoard.tsx
'use client';

import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';

export const TaskBoard: React.FC = () => {
  const { tasks, isLoading } = useTasks('calendar-id-here');

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>No tasks yet</p>
        <p className="text-sm">Create a task to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};
```

**Task Card Component:**
```typescript
// components/tasks/TaskCard.tsx
'use client';

import { CheckCircle, ChevronDown, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTaskStore } from '@/lib/stores/taskStore';
import { EntryCard } from '@/components/entries/EntryCard';
import type { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { expandedTaskIds, toggleTaskExpanded } = useTaskStore();
  const isExpanded = expandedTaskIds.has(task.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {task.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{task.completion_percentage}%</span>
          </div>
          <Progress value={task.completion_percentage} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="w-3 h-3" />
            <span>{task.completed_entries} of {task.total_entries} completed</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={() => toggleTaskExpanded(task.id)}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full">
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "transform rotate-180"
            )} />
            <span>{task.total_entries} entries</span>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-2">
            {task.entries?.map((entry) => (
              <EntryCard key={entry.id} entry={entry} compact />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
```

**Acceptance Criteria:**
- [ ] Task cards display in grid
- [ ] Progress bar shows completion
- [ ] Entry count is visible
- [ ] Tasks are expandable
- [ ] Entries show when expanded
- [ ] Empty state shows when no tasks
- [ ] Menu has edit/archive/delete options

**Dependencies:** Task 1.2.2  
**Estimated Time:** 5 hours  
**Priority:** P0

---

## 🎯 EPIC 6: Real-time Sync & Polish

**Goal:** Implement WebSocket sync and polish the UI

### Story 6.1: WebSocket Integration

**As a** user  
**I want** changes to sync in real-time  
**So that** I see updates from other devices/tabs immediately

#### Task 6.1.1: Setup WebSocket Connection

**Description:** Implement WebSocket hook and connection management

**Hook:**
```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEntryStore } from '@/lib/stores/entryStore';
import { useTaskStore } from '@/lib/stores/taskStore';

export const useWebSocket = (calendarId: string) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    if (!token || !calendarId) return;

    const wsUrl = `ws://localhost:8000/ws/calendar/${calendarId}?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleMessage(message);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt reconnection after 3 seconds
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [calendarId]);

  const handleMessage = (message: any) => {
    const { type, data } = message;

    switch (type) {
      case 'entry:created':
        queryClient.setQueryData<Entry[]>(
          ['entries', calendarId],
          (old = []) => [...old, data]
        );
        break;

      case 'entry:updated':
        queryClient.setQueryData<Entry[]>(
          ['entries', calendarId],
          (old = []) => old.map(e => e.id === data.id ? data : e)
        );
        break;

      case 'entry:deleted':
        queryClient.setQueryData<Entry[]>(
          ['entries', calendarId],
          (old = []) => old.filter(e => e.id !== data.id)
        );
        break;

      case 'task:updated':
        queryClient.setQueryData<Task[]>(
          ['tasks', calendarId],
          (old = []) => old.map(t => t.id === data.id ? data : t)
        );
        break;

      case 'pong':
        // Heartbeat response
        break;
    }
  };

  useEffect(() => {
    connect();

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  return { ws: ws.current };
};
```

**Usage in Layout:**
```typescript
// app/(dashboard)/layout.tsx
'use client';

import { useWebSocket } from '@/hooks/useWebSocket';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Initialize WebSocket connection
  useWebSocket('calendar-id-here'); // TODO: Get from auth context

  return (
    // ... layout content
  );
}
```

**Acceptance Criteria:**
- [ ] WebSocket connects on mount
- [ ] Connection includes auth token
- [ ] Auto-reconnects on disconnect
- [ ] Heartbeat keeps connection alive
- [ ] Messages update React Query cache
- [ ] UI updates reactively
- [ ] Multiple tabs sync correctly

**Dependencies:** Task 1.2.2  
**Estimated Time:** 4 hours  
**Priority:** P1

---

## 🎯 EPIC 7: Mobile App (React Native)

**Goal:** Build mobile app with shared business logic

### Story 7.1: Mobile Setup

**As a** developer  
**I want** a React Native app with Expo  
**So that** I can build for iOS and Android

#### Task 7.1.1: Initialize Expo Project

**Description:** Create React Native project with Expo

**Commands:**
```bash
# Create Expo app
npx create-expo-app packages/mobile --template tabs

# Install dependencies
cd packages/mobile
npm install @tanstack/react-query axios zustand date-fns

# Link shared package
npm install ../shared
```

**Project Structure:**
```
packages/mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── calendar.tsx
│   │   ├── entries.tsx
│   │   └── tasks.tsx
│   ├── _layout.tsx
│   └── index.tsx
├── components/
├── constants/
├── app.json
└── package.json
```

**Acceptance Criteria:**
- [ ] Expo project runs on iOS simulator
- [ ] Expo project runs on Android emulator
- [ ] Shared package is linked
- [ ] TypeScript is configured
- [ ] Basic navigation works

**Dependencies:** Task 1.1.2  
**Estimated Time:** 3 hours  
**Priority:** P1

---

## 📊 Implementation Timeline

### Week 1-2: Setup & Auth
- [ ] Complete Epic 1 (Setup)
- [ ] Complete Epic 2 (Auth)
- [ ] **Milestone:** Can register, login, see basic layout

### Week 3-4: Calendar View
- [ ] Complete Epic 3 (Calendar)
- [ ] **Milestone:** Can view entries in calendar, navigate months

### Week 5-6: Entry & Task Management
- [ ] Complete Epic 4 (Entries)
- [ ] Complete Epic 5 (Tasks)
- [ ] **Milestone:** Can CRUD entries and tasks

### Week 7: Real-time & Polish
- [ ] Complete Epic 6 (WebSocket)
- [ ] **Milestone:** Multi-tab sync works

### Week 8: Mobile
- [ ] Complete Epic 7 (Mobile)
- [ ] **Milestone:** Mobile app mirrors web functionality

---

## ✅ Definition of Done

A task is considered "done" when:
- [ ] All acceptance criteria are met
- [ ] Code is committed and pushed
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Component renders without errors
- [ ] Basic manual testing passed
- [ ] Peer reviewed (if working in team)

---

## 🎯 Priority Legend

- **P0 (Blocker):** Must complete before other work
- **P1 (High):** Core functionality, complete ASAP
- **P2 (Medium):** Important but not blocking
- **P3 (Low):** Nice to have, can defer

---

## 📝 Task Tracking

Use this checklist format in your project management tool:

```markdown
## Task [ID]: [Title]
- [ ] Acceptance Criterion 1
- [ ] Acceptance Criterion 2
- [ ] Acceptance Criterion 3
- [ ] Code review
- [ ] Tested
- [ ] Deployed
```

---

**Frontend TASKS Status:** ✅ Ready for Implementation

**Next Steps:**
1. Review all tasks with team
2. Assign tasks to developers
3. Start with Epic 1, Task 1.1.1
4. Follow dependencies
5. Track progress daily

**Estimated Total Time:** 8 weeks with 2 frontend developers

---

**Note:** This document should be updated as you progress. Mark completed tasks with ✅ and add notes about challenges or changes.
