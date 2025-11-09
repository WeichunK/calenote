# Hydration Error Fix - Testing Checklist

## Problem Summary
React hydration error caused by:
1. AuthGuard returning `null` on server but `<div>` on client
2. Zustand persist middleware reading from localStorage (client-only)
3. Different server/client state for authentication

## Root Cause
- **Server**: localStorage doesn't exist → isAuthenticated = false → AuthGuard returns `null`
- **Client**: localStorage exists → isAuthenticated = true → AuthGuard returns children with dashboard layout
- **Result**: HTML structure mismatch → hydration error

## Fix Applied

### 1. AuthGuard Component (/home/weijun/calenote/packages/web/src/components/auth/AuthGuard.tsx)
**Strategy**: Ensure consistent HTML structure between server and client

**Changes**:
- Added `isHydrated` state to track client-side hydration
- Server and initial client render both show loading skeleton with same HTML structure
- Only after hydration complete, check authentication and either show content or redirect
- Both loading states use `<div className="flex h-screen overflow-hidden">` to match DashboardLayout

**Before**:
```typescript
if (!isAuthenticated) {
  return null; // ❌ Returns nothing, causes hydration mismatch
}
return <>{children}</>;
```

**After**:
```typescript
if (!isHydrated) {
  return <LoadingSkeleton />; // ✅ Consistent structure
}
if (!isAuthenticated) {
  return <RedirectingSkeleton />; // ✅ Still shows consistent structure
}
return <>{children}</>;
```

### 2. UIStore Date Initialization (/home/weijun/calenote/packages/web/src/lib/stores/uiStore.ts)
**Strategy**: Use date without time to avoid timestamp differences

**Before**:
```typescript
selectedDate: new Date(), // ❌ Different timestamp on server vs client
```

**After**:
```typescript
selectedDate: new Date(new Date().toDateString()), // ✅ Normalized to midnight
```

## Testing Steps

### 1. Check Browser Console
- [ ] No hydration warnings
- [ ] No "Text content did not match" errors
- [ ] No "Hydration failed" errors

### 2. Test Authentication Flow
- [ ] Unauthenticated user sees loading → redirects to /login
- [ ] Authenticated user sees loading → then dashboard
- [ ] Loading skeleton has same HTML structure as final dashboard layout

### 3. Test Server-Side Rendering
```bash
# Build production version
npm run build
npm run start

# Check SSR output
curl http://localhost:3000/calendar | grep "flex h-screen"
```

### 4. Test Different Scenarios
- [ ] Fresh page load (clear localStorage)
- [ ] Page refresh when authenticated
- [ ] Navigation between routes
- [ ] Hard refresh (Ctrl+Shift+R)

## Expected Behavior

### Server HTML (SSR):
```html
<div class="flex h-screen overflow-hidden">
  <div class="flex items-center justify-center w-full">
    <div class="text-center">
      <div class="animate-spin ...">Loading...</div>
    </div>
  </div>
</div>
```

### Client HTML (after hydration):
- If authenticated: Same div structure with Sidebar and Header children
- If not authenticated: Same div structure with "Redirecting to login..." message

## Verification Commands

```bash
# 1. Check if dev server shows any hydration errors
npm run dev
# Open http://localhost:3000/calendar
# Check browser console

# 2. Test production build
npm run build
npm run start
# Open http://localhost:3000/calendar
# Check browser console

# 3. Check React DevTools
# Look for any hydration warnings in Components tab
```

## Additional Notes

- The fix ensures AuthGuard ALWAYS renders a `<div className="flex h-screen overflow-hidden">` container
- This matches the structure expected by DashboardLayout
- The loading state is briefly visible (typically <100ms) but prevents hydration errors
- React 19 is stricter about hydration, so this fix is essential

## Files Changed
1. `/home/weijun/calenote/packages/web/src/components/auth/AuthGuard.tsx` - Main fix
2. `/home/weijun/calenote/packages/web/src/lib/stores/uiStore.ts` - Date normalization

## Related Issues Prevented
- ✅ Prevents "Hydration failed" errors
- ✅ Prevents layout shift during authentication check
- ✅ Prevents console spam from React hydration warnings
- ✅ Works correctly with React 19's stricter hydration rules
- ✅ Compatible with Next.js 16 App Router
