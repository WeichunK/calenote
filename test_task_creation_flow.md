# Task Creation Flow Debug Analysis

## Step-by-Step Flow

### 1. Component Mount
```
TasksPage renders
  → TaskBoard renders
    → useCalendars() called
      → currentCalendar might be undefined initially
    → useTasks({ calendar_id: currentCalendar?.id, status: ... }) called
      → If calendar_id is undefined, query is DISABLED (enabled: false)
      → Query data remains undefined
```

### 2. User Creates Task
```
User clicks "New Task"
  → TaskDialog opens
  → User fills form and submits
    → useCreateTask().mutate(data) called
```

### 3. Optimistic Update (onMutate)
```
onMutate runs:
  1. Cancel queries with queryKey: ['tasks', 'list']
  2. Get snapshot of existing data
  3. setQueriesData({ queryKey: ['tasks', 'list'] }, updater)
     → This SHOULD match ['tasks', 'list', { calendar_id: '...' }]
     → But IF the query was never enabled, there's NO cache entry to update!
     → setQueriesData might not create a new cache entry if none exists
```

### 4. Success Callback (onSuccess)
```
onSuccess runs:
  → invalidateQueries({ queryKey: ['tasks', 'list'] })
  → This triggers a refetch of matching queries
  → BUT if the query is still disabled (calendar_id undefined), it won't refetch!
```

## Root Cause Hypothesis

The issue is likely one of these:

### Hypothesis A: Query Never Enabled
- If currentCalendar loads slowly, the query is disabled
- When optimistic update runs, there's no cache entry to update
- setQueriesData might not create entries for disabled queries
- When onSuccess invalidates, the query is still disabled so no refetch happens

### Hypothesis B: Calendar ID Changes After Mount
- Initial render: calendar_id = undefined, query disabled
- Calendar loads: calendar_id = 'abc123', query enabled and fetches
- User creates task: optimistic update targets ['tasks', 'list']
- But the actual cache key is ['tasks', 'list', { calendar_id: 'abc123' }]
- Wait... this SHOULD match because React Query uses prefix matching

### Hypothesis C: setQueriesData Doesn't Create New Entries
- If the query hasn't run yet (first visit to tasks page)
- Cache entry doesn't exist: undefined
- setQueriesData with updater might not create a new entry if old is undefined
- Need to verify React Query v5 behavior

## Testing Strategy

1. Check browser console for React Query DevTools
2. Look at cache state before and after creating a task
3. Add console.logs to useTasks to see when it's enabled/disabled
4. Check if calendar_id is available when creating task
