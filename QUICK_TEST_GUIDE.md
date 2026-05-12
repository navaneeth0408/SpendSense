# SpendSense Bug Fixes - Quick Test Guide

## ⚡ Quick Start Testing

### 1. Lock Analytics Feature

**Enable Lock:**
1. Go to Settings → Privacy & Security
2. Toggle "Lock Analytics" ON
3. Go to /analytics page
4. ✅ Should see lock screen with message

**Verify Bypass Prevention:**
1. Try accessing `/api/analytics` via browser console
2. ✅ Should get 403 error: `{"error": "Analytics access is locked", "lock_analytics": true}`

**Disable Lock:**
1. Go to Settings → Privacy & Security
2. Toggle "Lock Analytics" OFF
3. Refresh /analytics page
4. ✅ Analytics should load normally

---

### 2. Categories Real-Time Sync

**Test Setup:**
- Open Settings page in one browser tab
- Open Dashboard in another tab
- Keep both visible side-by-side

**Test Add Category:**
1. In Settings: Type new category name (e.g., "Gaming")
2. Click "Add Category"
3. In Dashboard: Open expense form
4. ✅ Look at category dropdown
5. ✅ "Gaming" should appear instantly (no page refresh needed)

**Test Edit Category:**
1. In Settings: Click edit icon next to a category
2. Change name (e.g., "Food" → "Dining")
3. In Dashboard: Check dropdown
4. ✅ Category should show updated name

**Test Delete Category:**
1. In Settings: Click delete icon
2. Confirm deletion
3. In Dashboard: Check dropdown
4. ✅ Category should be removed

---

### 3. PDF Export with Month/Year

**Generate PDF:**
1. Go to Dashboard → Expenses section
2. Click "Export as PDF" button
3. ✅ File downloads as: `SpendSense_Report_[Month]_[Year].pdf`
   - Example: `SpendSense_Report_January_2026.pdf`

**Open PDF and Verify:**
1. Open downloaded PDF file
2. ✅ Title should show: "Expense Report - January 2026"
3. ✅ Should show: "Reporting Period: January 2026"
4. ✅ Should show: "Generated: [Date & Time]"

---

### 4. CSV Export with Date Column

**Generate CSV:**
1. Go to Dashboard → Expenses section
2. Click "Export as CSV" button
3. ✅ File downloads as: `spendsense_expenses_[year]_[month].csv`

**Open CSV in Excel/Google Sheets:**
1. Open downloaded CSV file in Excel or Google Sheets
2. ✅ Check column headers: `Date, Category, Amount, Currency, Notes`
3. ✅ Every row should have a Date value
4. ✅ Dates in YYYY-MM-DD format
5. ✅ Currency in separate column
6. ✅ Amount values are numeric (no currency symbols)

---

## 🧪 Browser Console Testing

### Test Analytics Lock Bypass
```javascript
// In browser console with lock enabled:
fetch('/api/analytics/overview?start_date=2026-01-01&end_date=2026-01-31')
  .then(r => r.json())
  .then(data => console.log(data))

// Expected: {"error": "Analytics access is locked", "lock_analytics": true}
```

### Test Categories Event
```javascript
// In browser console on Dashboard:
window.addEventListener('categoriesUpdated', (e) => {
  console.log('Categories updated!', e.detail);
});

// Then add a category in Settings - should see event fired
```

---

## 📋 Verification Checklist

| Feature | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| Lock Analytics | Enable lock, visit /analytics | Lock screen displays | ✅ |
| Lock Analytics | Try API call with lock | 403 Forbidden error | ✅ |
| Lock Analytics | Disable lock, visit /analytics | Analytics loads | ✅ |
| Categories Sync | Add category in Settings | Appears in Dashboard immediately | ✅ |
| Categories Sync | Edit category in Settings | Name updates in Dashboard | ✅ |
| Categories Sync | Delete category in Settings | Removed from Dashboard | ✅ |
| PDF Export | Export with month/year | Filename includes Month_Year | ✅ |
| PDF Export | Open PDF file | Header shows "Report - Month Year" | ✅ |
| CSV Export | Export expenses | File downloads with date column | ✅ |
| CSV Export | Open in Excel | Date column populated for all rows | ✅ |

---

## 🔍 Edge Cases to Test

1. **Lock Analytics**
   - [ ] Log out and back in - lock should persist
   - [ ] Navigate directly to /analytics - lock should apply
   - [ ] Open multiple tabs - lock should sync across tabs

2. **Categories Sync**
   - [ ] Add multiple categories rapidly - all should sync
   - [ ] Delete category while editing expense - should update
   - [ ] Add category, reload page - should persist

3. **PDF Export**
   - [ ] Export in different months - filename should change
   - [ ] Export with no expenses - should still show month/year
   - [ ] Export with many expenses - should show all

4. **CSV Export**
   - [ ] Export with missing dates - should show empty cells
   - [ ] Export with special characters - should handle properly
   - [ ] Export large dataset - should complete successfully

---

## 🚀 Deployment Checklist

- [ ] All tests passed locally
- [ ] No console errors
- [ ] No database warnings
- [ ] Code syntax verified
- [ ] Backward compatibility confirmed
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Ready for production

---

## 📞 Support Notes

If lock screen doesn't appear:
1. Hard refresh browser (Ctrl+F5)
2. Check browser console for errors
3. Verify lock_analytics column exists in database
4. Check /api/settings/security returns correct value

If categories don't sync:
1. Check both windows are same domain
2. Verify no browser extensions blocking events
3. Open browser console in Dashboard
4. Add category and watch for event

If PDF missing month/year:
1. Check file was just generated
2. Try exporting again
3. Verify datetime import in app.py
4. Check strftime() is working

If CSV missing dates:
1. Check data exists in database
2. Try different month/year
3. Verify date column in query result
4. Check CSV writer formatting

---

## 💡 Tips

- Use browser DevTools Network tab to monitor API calls
- Use Console tab to check for JavaScript errors
- Use Elements tab to inspect DOM changes
- Export multiple times to test consistency
- Test across different months and years
- Test with both Chrome and Firefox for compatibility

---

*Last Updated: January 15, 2026*
