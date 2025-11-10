# React Query v5 setQueriesData Behavior

## Documentation Check

From React Query v5 docs:

```typescript
queryClient.setQueriesData(
  { queryKey: filters },
  updater
)
```

### Key Points:
1. **Filters Object**: `{ queryKey: ['tasks', 'list'] }` uses PARTIAL MATCHING
2. **Matching Behavior**: Will match any query key that STARTS WITH the provided key
3. **Updater Function**: Called for EACH matching cache entry

### Example:
```typescript
// Cache state:
{
  ['tasks', 'list', { calendar_id: 'abc' }]: [task1, task2],
  ['tasks', 'list', { calendar_id: 'xyz' }]: [task3]
}

// This call:
queryClient.setQueriesData(
  { queryKey: ['tasks', 'list'] },
  (old) => old ? [newTask, ...old] : [newTask]
)

// Will update BOTH cache entries:
{
  ['tasks', 'list', { calendar_id: 'abc' }]: [newTask, task1, task2],
  ['tasks', 'list', { calendar_id: 'xyz' }]: [newTask, task3]
}
```

## Critical Question

**What if the cache entry doesn't exist yet?**

### Scenario 1: Query Never Run (No Cache Entry)
```typescript
// Cache state: {}
// No entry for ['tasks', 'list', { calendar_id: 'abc' }]

queryClient.setQueriesData(
  { queryKey: ['tasks', 'list'] },
  (old) => [newTask]
)

// Result: ???
// Does it create a new cache entry?
// Or does it only update existing entries?
```

According to React Query docs:
> "setQueriesData will invoke the updater function for **each existing query** that matches the queryKey"

**KEY WORD: "EXISTING QUERY"**

This means:
- ❌ It does NOT create new cache entries
- ✅ It only updates queries that have already been fetched

## Implication

If the tasks query hasn't run yet (because calendar_id was undefined), then:
1. No cache entry exists for ['tasks', 'list', { calendar_id: 'abc123' }]
2. setQueriesData finds no matching entries to update
3. Optimistic update does nothing
4. onSuccess invalidates, but query might still be disabled
5. Task doesn't appear in UI

## Solution

We need to ensure the query has run at least once before creating a task, OR we need to use setQueryData to create a specific cache entry.
