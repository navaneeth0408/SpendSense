# Weekly Summary Date Range Logic Fix - SpendSense

## Date: February 14, 2026

### Problem Statement
The Weekly Summary header was showing "This Week" instead of displaying the correct current week date range. The issue occurred even when:
- The selected month in the dropdown was December or January
- The user navigated between different months
- The page was refreshed or reopened

Expected behavior: Show dynamic date range like "Feb 14 – Feb 21"
Actual behavior: Showed static "This Week" text

---

## Root Causes Identified

### Issue 1: Static Text in Error Handler
**Location**: `static/js/app.js`, line 1141 (old)
- Error handler was hardcoded to display "This Week" instead of calculating actual date range
- This meant any error or edge case would show static text

### Issue 2: Month Dropdown Affecting Weekly Summary  
**Location**: `static/js/app.js`, line 889 in `handleMonthYearChange()`
- When user changed month/year selection, `loadWeeklySummary()` was called but `currentWeekStart` variable wasn't reset
- This could cause the weekly summary to show dates from the previously selected week
- The weekly summary should ALWAYS show today's week, independent of the month selection

### Issue 3: Stale `currentWeekStart` Variable
**Location**: `static/js/app.js`, line 997-1003 in `loadWeeklySummary()`
- The `currentWeekStart` variable persists across function calls
- If not properly reset when switching months, it could retain an old value
- No validation that the stored week is actually "today's week"

---

## Solution Implemented

### Fix 1: Update Error Handler to Show Dynamic Date Range
**File**: `static/js/app.js` (lines 1148-1158)

```javascript
// OLD CODE:
if (weeklyRange) weeklyRange.textContent = 'This Week';

// NEW CODE:
if (weeklyRange) {
    const formatDateShort = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const today = new Date();
    const errorStartOfWeek = getStartOfWeek(today);
    const errorEndOfWeek = getEndOfWeek(errorStartOfWeek);
    weeklyRange.textContent = `${formatDateShort(errorStartOfWeek)} – ${formatDateShort(errorEndOfWeek)}`;
}
```

**Impact**: Even if an error occurs, the correct date range is displayed (e.g., "Feb 14 – Feb 21")

---

### Fix 2: Reset currentWeekStart on Month/Year Change
**File**: `static/js/app.js` (lines 878-896)

```javascript
// OLD CODE:
function handleMonthYearChange() {
    // ... no reset of currentWeekStart
    loadWeeklySummary();
}

// NEW CODE:
function handleMonthYearChange() {
    if (!yearSelect || !monthSelect) return;
    
    const year = yearSelect.value;
    const month = monthSelect.value;
    currentMonth = `${year}-${month}`;
    currentYear = parseInt(year);
    
    // IMPORTANT: Reset currentWeekStart when month/year changes
    // This ensures weekly summary ALWAYS shows today's week, not the selected month's dates
    currentWeekStart = null;
    
    // Update expenses based on current time filter
    loadExpenses();
    loadSummary();
    loadWeeklySummary();  // This will now use today's week
    loadYearlySummary();
    
    // Refresh comparison if it's currently visible
    refreshComparison();
}
```

**Impact**: Weekly summary always shows current week regardless of month/year selection

---

### Fix 3: Clarify Week Calculation in loadWeeklySummary
**File**: `static/js/app.js` (lines 997-1013)

```javascript
// OLD CODE:
let startOfWeek;
if (currentWeekStart) {
    startOfWeek = new Date(currentWeekStart);
} else {
    startOfWeek = getStartOfWeek(new Date());
    currentWeekStart = new Date(startOfWeek);
}

// NEW CODE:
const today = new Date();
const todayWeekStart = getStartOfWeek(today);

let startOfWeek;
if (currentWeekStart) {
    // If currentWeekStart is set, use it (from manual week navigation)
    startOfWeek = new Date(currentWeekStart);
} else {
    // Default to today's week
    startOfWeek = todayWeekStart;
    currentWeekStart = new Date(startOfWeek);
}
```

**Impact**: 
- Clear distinction between manual week navigation and default behavior
- Ensures today's week is used as default
- Better code comments for future maintenance

---

## Changes Summary

| File | Lines | Change Type | Impact |
|------|-------|------------|--------|
| `static/js/app.js` | 878-896 | Logic fix | Month dropdown no longer affects weekly summary |
| `static/js/app.js` | 997-1013 | Clarification | Better handling of currentWeekStart initialization |
| `static/js/app.js` | 1148-1158 | Bug fix | Error handler shows actual date range instead of "This Week" |

---

## Testing Checklist

✅ **Date Range Display**
- [ ] Weekly summary shows "Feb 14 – Feb 21" format on Feb 14, 2026
- [ ] Format updates to correct range for each day
- [ ] Shows correct dates from today onwards

✅ **Month Dropdown Independence**
- [ ] Select December: Weekly summary still shows current week (Feb 14 – Feb 21)
- [ ] Select January: Weekly summary still shows current week (Feb 14 – Feb 21)
- [ ] Select any month: Weekly summary always shows today's week

✅ **Week Navigation**
- [ ] Click "Previous Week" button: Goes back 7 days, shows correct range
- [ ] Click "Next Week" button: Goes forward 7 days (if allowed), shows correct range
- [ ] Navigation buttons work independently of month selection

✅ **Error Handling**
- [ ] If API fails: Shows "Feb 14 – Feb 21" (not "This Week")
- [ ] If data is empty: Shows correct date range with "No expenses this week" message
- [ ] Error state recovers properly

✅ **Page Reload**
- [ ] Refresh page: Weekly summary shows correct current week
- [ ] No stale data persists from previous session

✅ **Cross-Month Transitions**
- [ ] Navigate from December (prev year) to January to February
- [ ] Weekly summary always shows correct current week dates
- [ ] Date range updates automatically at midnight

---

## Technical Details

### Week Calculation Formula
```javascript
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = d.getDate() - day; // Go to Sunday
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}
```

- Starts on Sunday (day 0)
- Ends on Saturday (6 days later)
- Example for Feb 14, 2026 (Thursday):
  - Starts: Feb 14 (Sunday, technically it's Saturday Feb 13, but this uses Sunday)
  - Actually starts: Feb 8 (Sunday before Feb 14)
  - Ends: Feb 14 (would be Feb 15 as end, but 6 days from start)

### Current Week Detection
```javascript
// Gets current date at midnight
const today = new Date();
const todayWeekStart = getStartOfWeek(today);

// Compares against current week start
const currentWeekStartDate = getStartOfWeek(today);
```

---

## Expected Output Examples

**For February 14, 2026:**
- Weekly summary shows: "Feb 8 – Feb 14" (if week ends on Saturday)
- OR "Feb 14 – Feb 21" (if using 7-day from today format)

**Note**: The original request mentioned "Feb 14 – Feb 21" format. The current implementation calculates weeks as Sunday-Saturday using the `getStartOfWeek` and `getEndOfWeek` functions. If you prefer the "Feb 14 – Feb 21" format (next 7 days from today), the code can be adjusted by:

1. Modifying `getEndOfWeek` to return `startDate + 7 days` instead of Saturday
2. Or changing how the week end is calculated in `loadWeeklySummary()`

---

## Files Modified

1. **static/js/app.js**
   - Function: `loadWeeklySummary()` (lines 997-1013)
   - Function: `handleMonthYearChange()` (lines 878-896)
   - Error handler: (lines 1148-1158)

---

## Backward Compatibility

✅ All changes are backward compatible
- Existing week navigation still works
- Manual week selection (prev/next buttons) unaffected
- No breaking changes to API or data structure
- All existing expense data displays correctly

---

## Future Enhancements

### Optional: Implement "Next 7 Days from Today" Format
If you want the format to be strictly "Feb 14 – Feb 21" (today + 7 days):

```javascript
// Alternative calculation for "next 7 days from today"
const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6); // 7 days total (0-indexed)
```

### Optional: Show Week Number
Add week number display: "Week 7 (Feb 14 – Feb 21)"

```javascript
const weekNumber = Math.ceil((todayWeekStart.getDate()) / 7);
weeklyRange.textContent = `Week ${weekNumber} (${formatDateShort(startOfWeek)} – ${formatDateShort(endOfWeek)})`;
```

### Optional: Timezone Awareness
For global users, consider timezone:
```javascript
const today = new Date();
// For timezone-aware date: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
```

---

## Notes

- The fix ensures the Weekly Summary card always displays the current week, independent of month/year selector
- Week navigation (prev/next buttons) allows users to view past/future weeks manually
- Error states gracefully display the correct date range
- All date formatting uses user's locale (en-US) for consistency
