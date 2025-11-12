# Timezone Conversion Bug Fix

## Problem Description

### Symptom
When a user creates an entry at **Nov 18, 9:00 PM (21:00)** local time (UTC+8):
- Calendar grid correctly shows: **Nov 18**
- But clicking the date shows: **Nov 19, 5:00 AM** (wrong date and time!)
- Time shift: **+8 hours** (exactly the timezone offset)

### Root Cause

The timestamp was being **double-interpreted** due to missing timezone information:

1. **Frontend → Backend**: Local time `21:00` sent as `"2025-11-18T21:00"` (NO TIMEZONE)
2. **Backend**: Interprets naive datetime as UTC `21:00` (PostgreSQL default timezone is UTC)
3. **Database**: Stores `2025-11-18 21:00:00+00` (UTC)
4. **Backend → Frontend**: Returns `"2025-11-18T21:00:00Z"` (UTC)
5. **Frontend**: Parses UTC and converts to local: `21:00 UTC → 05:00 UTC+8` (next day!)

**Result**: User's local time `Nov 18 21:00` becomes `Nov 19 05:00` after round-trip.

## Data Flow Analysis

### Before Fix (Buggy Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND INPUT                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ User in UTC+8 selects: Nov 18, 2025 21:00 (local time)            │
│ Browser datetime-local input: "2025-11-18T21:00"                   │
│                                                                     │
│ NO TIMEZONE INFO! ❌                                                │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ API REQUEST                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ POST /api/v1/entries                                               │
│ {                                                                   │
│   "timestamp": "2025-11-18T21:00"  ← NO TIMEZONE! ❌               │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND PYDANTIC PARSING                                            │
├─────────────────────────────────────────────────────────────────────┤
│ Pydantic parses "2025-11-18T21:00"                                 │
│ Result: datetime(2025, 11, 18, 21, 0, 0)                          │
│         tzinfo=None ← NAIVE DATETIME! ❌                            │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ POSTGRESQL STORAGE                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Column: TIMESTAMP WITH TIME ZONE                                    │
│ Server timezone: UTC                                                │
│                                                                     │
│ PostgreSQL interprets naive datetime as server timezone (UTC)       │
│ Stores: 2025-11-18 21:00:00+00 ← WRONG! Treated as UTC! ❌         │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Backend returns:                                                    │
│ {                                                                   │
│   "timestamp": "2025-11-18T21:00:00Z"  ← UTC timezone               │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND DISPLAY                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ parseISO("2025-11-18T21:00:00Z")                                   │
│ → Parses as UTC: Nov 18 21:00 UTC                                  │
│                                                                     │
│ Browser converts to local timezone (UTC+8):                         │
│ → Nov 18 21:00 UTC + 8 hours = Nov 19 05:00 LOCAL                  │
│                                                                     │
│ WRONG! User sees Nov 19 05:00 instead of Nov 18 21:00 ❌           │
└─────────────────────────────────────────────────────────────────────┘
```

### After Fix (Correct Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND INPUT                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ User in UTC+8 selects: Nov 18, 2025 21:00 (local time)            │
│ Browser datetime-local input: "2025-11-18T21:00"                   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ CONVERSION TO UTC (NEW!)                                            │
├─────────────────────────────────────────────────────────────────────┤
│ convertLocalToUTC("2025-11-18T21:00")                              │
│                                                                     │
│ Step 1: new Date("2025-11-18T21:00")                              │
│         → Browser creates Date in local timezone (UTC+8)            │
│         → Internally: 2025-11-18 21:00:00+08:00                    │
│                                                                     │
│ Step 2: .toISOString()                                             │
│         → Converts to UTC: 21:00 UTC+8 - 8 hours = 13:00 UTC      │
│         → Returns: "2025-11-18T13:00:00.000Z"                      │
│                                                                     │
│ Result: "2025-11-18T13:00:00.000Z" ✅ CORRECT UTC!                 │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ API REQUEST                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ POST /api/v1/entries                                               │
│ {                                                                   │
│   "timestamp": "2025-11-18T13:00:00.000Z"  ← UTC with timezone! ✅ │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND PYDANTIC PARSING                                            │
├─────────────────────────────────────────────────────────────────────┤
│ Pydantic parses "2025-11-18T13:00:00.000Z"                        │
│ Result: datetime(2025, 11, 18, 13, 0, 0)                          │
│         tzinfo=timezone.utc ← AWARE DATETIME! ✅                    │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ POSTGRESQL STORAGE                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Column: TIMESTAMP WITH TIME ZONE                                    │
│ Stores: 2025-11-18 13:00:00+00 ← CORRECT! Actual UTC time! ✅      │
│                                                                     │
│ This represents Nov 18 21:00 in UTC+8 timezone                      │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Backend returns:                                                    │
│ {                                                                   │
│   "timestamp": "2025-11-18T13:00:00Z"  ← UTC timezone               │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND DISPLAY                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ convertUTCToLocal("2025-11-18T13:00:00Z")                          │
│                                                                     │
│ Step 1: new Date("2025-11-18T13:00:00Z")                          │
│         → Parses as UTC: Nov 18 13:00 UTC                           │
│                                                                     │
│ Step 2: Extract local time components                              │
│         → getFullYear(), getMonth(), getDate(), etc.                │
│         → Browser converts to local: 13:00 UTC + 8 = 21:00 LOCAL   │
│                                                                     │
│ Step 3: Format as datetime-local                                   │
│         → Returns: "2025-11-18T21:00"                              │
│                                                                     │
│ Result: User sees Nov 18 21:00 ✅ CORRECT!                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Solution Implementation

### Files Created

1. **`/home/weijun/calenote/packages/web/src/lib/utils/datetime.ts`**
   - New utility module for timezone conversions
   - Functions:
     - `convertLocalToUTC(localDateTimeString)`: Converts datetime-local input to UTC ISO string
     - `convertUTCToLocal(utcISOString)`: Converts UTC ISO string to datetime-local format
     - `isValidDateTime(dateTimeString)`: Validates datetime strings
     - `getCurrentLocalDateTime()`: Gets current time in datetime-local format

### Files Modified

2. **`/home/weijun/calenote/packages/web/src/app/(dashboard)/calendar/components/EntryDialog.tsx`**
   - Import timezone conversion utilities
   - **On form load (edit mode)**: Convert UTC timestamps to local for display
   - **On form submit**: Convert local timestamps to UTC before sending to backend

   Changes:
   - Line 11: Added import for `convertLocalToUTC, convertUTCToLocal`
   - Line 94-98: Use `convertUTCToLocal()` when loading entry data for editing
   - Line 148-155: Use `convertLocalToUTC()` when updating entry (edit mode)
   - Line 167-180: Use `convertLocalToUTC()` when creating entry (create mode)

## Technical Details

### Browser Behavior

The `datetime-local` input type:
- Returns string in format `"YYYY-MM-DDTHH:mm"` (no timezone)
- Interprets this as **local timezone** when creating Date object
- Example: User in UTC+8 inputs `"2025-11-18T21:00"`
  - `new Date("2025-11-18T21:00")` creates a Date in UTC+8
  - Internal representation: `2025-11-18T21:00:00+08:00`

### Conversion Logic

#### Local → UTC (convertLocalToUTC)
```typescript
new Date("2025-11-18T21:00")  // Browser treats as local (UTC+8)
  .toISOString()               // Converts to UTC
  → "2025-11-18T13:00:00.000Z" // 21:00 - 8 hours = 13:00 UTC
```

#### UTC → Local (convertUTCToLocal)
```typescript
const date = new Date("2025-11-18T13:00:00Z")  // Parses as UTC
date.getFullYear()  → 2025
date.getMonth()     → 10 (November)
date.getDate()      → 18
date.getHours()     → 21  // Browser converts: 13 UTC + 8 = 21 local
date.getMinutes()   → 0
→ Format: "2025-11-18T21:00"
```

### Backend (No Changes Required)

The backend already handles timezones correctly:

1. **Pydantic Schema** (`app/schemas/entry.py`):
   ```python
   timestamp: Optional[datetime] = None
   ```
   - Accepts ISO strings with timezone: `"2025-11-18T13:00:00.000Z"`
   - Parses to timezone-aware datetime: `datetime(2025, 11, 18, 13, 0, 0, tzinfo=timezone.utc)`

2. **SQLAlchemy Model** (`app/models/entry.py`):
   ```python
   timestamp: Mapped[Optional[datetime]] = mapped_column(
       TIMESTAMP(timezone=True),  # PostgreSQL TIMESTAMPTZ
       nullable=True,
   )
   ```
   - Stores in UTC
   - PostgreSQL automatically handles timezone conversion

3. **PostgreSQL**:
   - Server timezone: `UTC`
   - Column type: `TIMESTAMP WITH TIME ZONE`
   - Stores: `2025-11-18 13:00:00+00`

## Testing

### Manual Test Steps

1. **Create Entry Test**:
   ```
   1. Open http://localhost:3000/calendar
   2. Click on Nov 18, 2025
   3. Set time: 21:00 (9:00 PM)
   4. Save entry
   5. Verify: Calendar shows Nov 18
   6. Click Nov 18 again
   7. Verify: Modal shows 21:00 (NOT 05:00 next day!)
   ```

2. **Edit Entry Test**:
   ```
   1. Edit the entry created above
   2. Verify: Time input shows 21:00 (original time)
   3. Change time to 22:00
   4. Save
   5. Verify: Updated time shows 22:00 (NOT 06:00 next day!)
   ```

3. **Cross-Browser Test**:
   ```
   Test on multiple browsers and timezones:
   - Chrome (UTC+8)
   - Firefox (UTC+8)
   - Safari (UTC+8)
   - Chrome (UTC-5) - simulate US timezone
   ```

### Automated Tests

Run the datetime utility tests:
```bash
cd /home/weijun/calenote/packages/web
npm test -- datetime.test.ts
```

## Verification

### Before Fix
```
Input:  Nov 18 21:00 (local)
Stored: Nov 18 21:00 (UTC) ❌ WRONG!
Display: Nov 19 05:00 (local) ❌ WRONG!
```

### After Fix
```
Input:  Nov 18 21:00 (local)
Stored: Nov 18 13:00 (UTC) ✅ CORRECT!
Display: Nov 18 21:00 (local) ✅ CORRECT!
```

## Best Practices Applied

1. **Store in UTC**: All timestamps stored in database are UTC
2. **Display in Local**: UI always shows user's local time
3. **Explicit Conversion**: Clear conversion at boundaries (frontend ↔ backend)
4. **Timezone Awareness**: Backend uses timezone-aware datetimes
5. **No Assumptions**: Never assume timezone, always include it in ISO strings

## Edge Cases Handled

1. **Empty timestamps**: Return empty string, don't throw errors
2. **All-day events**: No time conversion needed (date only)
3. **Daylight Saving Time**: Browser automatically handles DST transitions
4. **Different timezones**: Each user sees their own local time correctly
5. **Multi-timezone teams**: UTC storage ensures consistency

## Future Considerations

1. **Timezone Display**: Consider showing timezone indicator in UI (e.g., "21:00 UTC+8")
2. **Timezone Selection**: Allow users to view calendar in different timezones
3. **Recurring Events**: Ensure timezone handling works with recurrence rules
4. **Mobile App**: Same conversion logic applies to React Native app

## Related Files

- Frontend:
  - `/home/weijun/calenote/packages/web/src/lib/utils/datetime.ts` (NEW)
  - `/home/weijun/calenote/packages/web/src/app/(dashboard)/calendar/components/EntryDialog.tsx` (MODIFIED)
  - `/home/weijun/calenote/packages/web/src/app/(dashboard)/calendar/components/DayEntriesModal.tsx` (uses parseISO - still correct)

- Backend (NO CHANGES):
  - `/home/weijun/calenote/app/schemas/entry.py`
  - `/home/weijun/calenote/app/models/entry.py`
  - `/home/weijun/calenote/app/crud/entry.py`

## Commit Message

```
fix(calendar): resolve timezone conversion bug causing incorrect entry timestamps

User-reported issue: Entries created at 21:00 local time displayed as 05:00 next day.

Root cause: Frontend sent datetime-local values without timezone info. Backend
interpreted naive datetimes as UTC, causing double timezone conversion on round-trip.

Solution:
- Created datetime utility module with convertLocalToUTC() and convertUTCToLocal()
- EntryDialog now converts local time to UTC before API calls
- EntryDialog converts UTC to local when loading entry data
- Follows best practice: store UTC, display local

Impact:
- All new and edited entries now preserve correct local time
- No backend changes required
- Works for users in any timezone

Tested:
- Manual verification in browser (UTC+8 timezone)
- Build verification passed
- Unit tests created for datetime utilities

Files changed:
- packages/web/src/lib/utils/datetime.ts (NEW)
- packages/web/src/app/(dashboard)/calendar/components/EntryDialog.tsx (MODIFIED)
- packages/web/src/lib/utils/__tests__/datetime.test.ts (NEW)
- TIMEZONE_FIX.md (NEW - this documentation)
```
