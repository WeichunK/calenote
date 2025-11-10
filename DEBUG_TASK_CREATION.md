# Debug Guide: Task Creation Failure

## Root Cause Identified

**The issue is confirmed**: The backend rejects empty strings for the `color` field.

### Backend Validation
```python
# From app/schemas/task.py line 20
color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
```

The backend expects:
- ✅ `null` or omitted (for no color)
- ✅ `"#RRGGBB"` (6 hex digits)
- ❌ `""` (empty string) - **FAILS with 422 error**

### Test Results
```bash
# Run: python3 test_api.py

Test 1: Minimal task → ✅ SUCCESS (201)
Test 2: Empty strings → ❌ FAILURE (422) "String should match pattern '^#[0-9A-Fa-f]{6}$'"
Test 3: Null values → ✅ SUCCESS (201)
Test 4: Valid color → ✅ SUCCESS (201)
```

## The Fix (Already Applied in commit 4a013d6)

The `sanitizeValue()` function in TaskDialog.tsx converts empty strings to `undefined`:

```tsx
const sanitizeValue = (value: any) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};
```

When `undefined` is passed to `JSON.stringify()`, it's automatically omitted from the JSON:
```javascript
JSON.stringify({ color: undefined, title: "Test" })
// Result: {"title":"Test"}
```

## Why It Might Still Be Failing

### 1. Dev Server Not Restarted
The Next.js dev server may be serving cached/old code.

**Solution:**
```bash
cd /home/weijun/calenote/packages/web
npm run dev  # Stop with Ctrl+C first, then restart
```

### 2. Browser Cache
The browser may have cached the old JavaScript bundle.

**Solution:**
- Hard refresh: `Ctrl+Shift+R` (Linux/Windows) or `Cmd+Shift+R` (Mac)
- OR Open DevTools → Network tab → Check "Disable cache"
- OR Clear browser cache completely

### 3. Service Worker Cache (if enabled)
If the app uses a service worker, it may be serving old code.

**Solution:**
- Open DevTools → Application tab → Service Workers → Unregister
- OR in DevTools → Application tab → Clear storage → Clear site data

## Verification Steps

### Step 1: Check Console Logs
I've added detailed logging to help debug. Open browser DevTools Console and create a task:

You should see:
```
[TaskDialog] Creating task with data: {
  currentData: { title: "...", color: "", ... },
  sanitizedData: { title: "...", color: undefined, ... },
  colorBefore: "",
  colorAfter: undefined
}

[API Client] POST request: {
  url: "/tasks",
  data: { calendar_id: "...", title: "...", ... }
}
```

**Check:** In the `POST request` log, the `data` object should NOT contain a `color` field if it was empty.

### Step 2: Check Network Request
1. Open DevTools → Network tab
2. Try creating a task
3. Find the `POST /api/v1/tasks` request
4. Click on it → Payload tab
5. Verify the JSON payload does NOT include `"color": ""` or `"icon": ""`

**Expected payload:**
```json
{
  "calendar_id": "24cb508f-9585-4205-9824-742af56e04ab",
  "title": "My Task"
}
```

**Bad payload (if fix not applied):**
```json
{
  "calendar_id": "24cb508f-9585-4205-9824-742af56e04ab",
  "title": "My Task",
  "color": "",
  "icon": ""
}
```

### Step 3: Check Response
If it still fails, check the Response tab in the same Network request.

**422 Error Response:**
```json
{
  "detail": [
    {
      "type": "string_pattern_mismatch",
      "loc": ["body", "color"],
      "msg": "String should match pattern '^#[0-9A-Fa-f]{6}$'",
      "input": ""
    }
  ]
}
```

This means empty string is still being sent.

## Alternative Fix (If Above Doesn't Work)

If the sanitizeValue approach isn't working, we can use a different approach - don't include optional fields in the data object at all:

```tsx
// In TaskDialog.tsx, replace the data creation:
const data: CreateTaskDTO = {
  calendar_id: currentCalendar.id,
  title: currentData.title.trim(),
};

// Only add optional fields if they have valid values
if (currentData.description?.trim()) {
  data.description = currentData.description.trim();
}

if (currentData.color?.trim() && currentData.color.match(/^#[0-9A-Fa-f]{6}$/)) {
  data.color = currentData.color;
}

if (currentData.icon?.trim()) {
  data.icon = currentData.icon.trim();
}

if (currentData.due_date) {
  data.due_date = currentData.due_date;
}
```

## Backend Logs

To see actual backend error, check Docker logs:
```bash
docker-compose logs -f backend | grep -A 5 -B 5 "422\|ValidationError"
```

## Files Modified

1. `/home/weijun/calenote/packages/web/src/components/tasks/TaskDialog.tsx`
   - Added `sanitizeValue()` function (line 115-120)
   - Applied to description, color, icon (lines 148, 150, 151)
   - Added debug logging (lines 154-159)

2. `/home/weijun/calenote/packages/shared/src/api/client.ts`
   - Added POST request logging (line 130)
   - Already had 422 error logging (line 59-66)

## Quick Test

Run this in browser console (after opening the app):
```javascript
// Test sanitizeValue logic
const sanitizeValue = (value) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

const testData = {
  title: "Test",
  color: sanitizeValue(""),
  icon: sanitizeValue("")
};

console.log('Object:', testData);
console.log('JSON:', JSON.stringify(testData));
// Should output: {"title":"Test"}
```

## Summary

The fix is correct and SHOULD work. The most likely issues are:
1. **Dev server needs restart** (most common)
2. **Browser cache needs clearing** (second most common)
3. **Hard refresh needed** (Ctrl+Shift+R)

After doing these steps, check the console logs and network request to confirm the fix is working.
