# Yearly Summary Fix - Complete Solution

## Problem Identified
1. Yearly summary was showing "Failed to load summary" error
2. No year selector dropdown available for yearly summary
3. Yearly summary was using the same year selector as monthly summary, causing unintended behavior changes

## Issues Fixed

### 1. **Failed to Load Summary**
- **Root Cause**: The `loadYearlySummary()` function was using `yearSelect.value` (from monthly selector) which could be null or cause timing issues
- **Solution**: 
  - Created a dedicated state variable `selectedYearlyYear` to track the selected year for yearly summary independently
  - Updated `loadYearlySummary()` to use `selectedYearlyYear || currentYear` instead of relying on the month selector's year

### 2. **Missing Year Selector for Yearly Summary**
- **Problem**: Users couldn't change the year displayed in the yearly summary
- **Solution**: Added a dedicated year dropdown selector next to the yearly summary title

## Changes Made

### Files Modified

#### 1. **templates/index.html**
- Updated yearly summary card structure to include a year selector dropdown
- Added `.card-header` div to properly align title and dropdown

```html
<div class="card-header">
    <h2 class="card-title yearly-card-title" id="yearly-title">Yearly Summary</h2>
    <select id="yearly-year-select" class="yearly-year-select" ...></select>
</div>
```

#### 2. **static/css/style.css**
Added CSS rules for proper layout:
```css
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-light);
}

.card-header .card-title {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
    flex: 1;
}

.yearly-year-select {
    min-width: 120px;
}
```

#### 3. **static/js/app.js**

**State Management** (line ~59):
```javascript
let selectedYearlyYear = new Date().getFullYear(); // Track separately for yearly summary
```

**DOM Element** (line ~85):
```javascript
const yearlyYearSelect = document.getElementById('yearly-year-select');
```

**Event Listener** (line ~204):
```javascript
if (yearlyYearSelect) {
    yearlyYearSelect.addEventListener('change', (e) => {
        selectedYearlyYear = parseInt(e.target.value);
        loadYearlySummary();
    });
}
```

**Initialization** (line ~1048):
```javascript
// Populate yearly year selector (current year ± 5 years)
if (yearlyYearSelect) {
    yearlyYearSelect.innerHTML = '';
    for (let y = year - 5; y <= year + 5; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === year) {
            option.selected = true;
        }
        yearlyYearSelect.appendChild(option);
    }
    // Initialize selectedYearlyYear
    selectedYearlyYear = year;
}
```

**Fixed loadYearlySummary()** (line ~1394):
```javascript
async function loadYearlySummary() {
    try {
        if (!yearlyTotal || !yearlyCategoryBreakdown) return;
        
        const year = selectedYearlyYear || currentYear; // ← Use dedicated yearly year
        
        // Fetch all expenses for the year
        const expenses = await api.get(`/api/expenses?year=${year}`);
        
        // ... rest of function
```

## Features Added

1. **Year Selector Dropdown**
   - Appears next to the "Yearly Summary" title
   - Shows years from (current year - 5) to (current year + 5)
   - Default selected: current year
   - Styled to match the application theme

2. **Independent Year State**
   - Yearly summary year selection is now independent from monthly summary
   - Changing month/year for monthly summary doesn't affect yearly summary
   - Yearly summary remembers user's year selection

3. **Fixed Data Loading**
   - Yearly summary data now loads correctly
   - Proper error handling for failed requests
   - Displays "No expenses for this year" if no data available

## Testing Checklist
- [x] Year selector dropdown appears next to yearly summary title
- [x] Selecting a different year loads that year's data
- [x] Year selector displays 11 years (current ± 5)
- [x] Current year is selected by default
- [x] Yearly summary displays totals correctly
- [x] Category breakdown shows all categories for selected year
- [x] Changing month in monthly summary doesn't affect yearly summary
- [x] No "Failed to load summary" error
- [x] Styling matches application theme

## Technical Details

### State Separation
- `currentYear`: Used for monthly summary and general context (line ~58)
- `selectedYearlyYear`: Used specifically for yearly summary (line ~59)
- This separation prevents conflicts between different summary views

### API Call
The `/api/expenses?year=YYYY` endpoint in the backend filters expenses by year and returns all expenses for that year across all months.

### Error Handling
If the yearly summary fails to load:
1. Error is logged to console
2. User sees "Failed to load summary" message
3. Category breakdown is cleared
4. User can retry by selecting a different year

## UI/UX Improvements
1. Title and year selector are now aligned horizontally using flexbox
2. Year selector has appropriate styling and spacing
3. Visual hierarchy maintained - title on left, selector on right
4. Responsive layout adapts to different screen sizes

## Backward Compatibility
- All existing functionality preserved
- Month/year selector for monthly summary unchanged
- Weekly summary unaffected
- All other features working as before
