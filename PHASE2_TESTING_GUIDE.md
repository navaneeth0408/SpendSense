# Phase 2 Bug Fixes - Testing Guide

## Overview
This document provides step-by-step testing procedures for the three critical bug fixes implemented in Phase 2:
1. **Fix: Categories Not Syncing in Expense Dropdown**
2. **Fix: CSV Export Missing Date Column**
3. **Feature: PDF Export with Month/Year Selection**

---

## Test 1: Categories Syncing in Real-Time

### Objective
Verify that new categories added in Settings immediately appear in the Dashboard expense dropdown without requiring a page reload.

### Prerequisites
- SpendSense application is running
- User is logged in
- Both Dashboard and Settings tabs are visible (or accessible)

### Test Steps

#### Step 1.1: Initial State
1. Open Dashboard in one browser tab
2. Open Settings in another browser tab (side-by-side)
3. In Dashboard, click on "Add Expense" to open the expense form
4. Note the categories currently in the "Category" dropdown
5. Record the list of visible categories (e.g., Food, Transport, Shopping, Bills, Entertainment, Healthcare, Education)

#### Step 1.2: Add New Category
1. Switch to Settings tab
2. Scroll to "📚 Categories" section
3. In the "Custom Categories" area, locate the input field and color picker
4. Enter a new category name (e.g., "Fitness")
5. Select a color (any color is fine)
6. Click "Add Category" button
7. Wait for the success message: "✓ Category added successfully"

#### Step 1.3: Verify Real-Time Sync
1. Switch back to Dashboard tab
2. Look at the Category dropdown in the expense form
3. **Expected Result:** The new "Fitness" category should now appear in the dropdown
4. **Verify:** The category is selectable and displays with the correct color

#### Step 1.4: Verify Persistence
1. Refresh the Dashboard page (F5)
2. Click "Add Expense" again
3. **Expected Result:** The new "Fitness" category should still be visible in the dropdown
4. Check that it persists across page reloads

#### Step 1.5: Multiple Categories
1. Go back to Settings
2. Add 2-3 more custom categories (e.g., "Gym", "Sports", "Hobby")
3. Switch to Dashboard without reloading
4. Click "Add Expense"
5. **Expected Result:** All newly added categories should appear in the dropdown

### Success Criteria
✅ Categories added in Settings appear immediately in Dashboard dropdown  
✅ No page reload required  
✅ Categories persist across page refreshes  
✅ Multiple categories sync correctly  

---

## Test 2: CSV Export with Date Column

### Objective
Verify that the CSV export includes the date column with proper date values from the database.

### Prerequisites
- SpendSense application is running
- User is logged in
- At least 3-5 expenses with different dates exist in the system

### Test Steps

#### Step 2.1: Create Test Expenses (if needed)
1. In Dashboard, add 3-5 expenses with different dates:
   - Expense 1: Date = 2024-01-15, Amount = $50, Category = Food
   - Expense 2: Date = 2024-01-20, Amount = $75, Category = Transport
   - Expense 3: Date = 2024-02-10, Amount = $100, Category = Shopping
   - etc.
2. Verify expenses appear in the Dashboard

#### Step 2.2: Export CSV
1. Go to Settings tab
2. Scroll to "📊 Data & Export" section
3. Locate "Export Formats" area
4. Click "📊 Export CSV" button
5. Save the file (e.g., "expenses.csv")

#### Step 2.3: Verify CSV Content
1. Open the downloaded CSV file in a text editor or spreadsheet application
2. Check the header row - should contain: `Date, Category, Amount, Currency, Notes`
3. **Expected Header:** `Date,Category,Amount,Currency,Notes`
4. Verify each row contains the correct data:
   - Date column: Should show dates like "2024-01-15", "2024-01-20", etc.
   - Category column: Should match the expense category
   - Amount column: Should show the expense amount
   - Currency column: Should show the user's currency (e.g., USD, EUR)
   - Notes column: Should show any notes or be empty

#### Step 2.4: Verify Date Format
1. Check that all dates are in the format: YYYY-MM-DD
2. Verify that dates correspond to the expenses entered in the Dashboard
3. Check that date column is NOT empty for any row

#### Step 2.5: Verify Multiple Months
1. Create expenses in different months (Jan, Feb, Mar)
2. Export CSV again
3. **Expected Result:** All expenses from all months should be included with correct dates

### Success Criteria
✅ CSV file includes Date column as first column  
✅ Date values are in YYYY-MM-DD format  
✅ All dates match the expenses shown in Dashboard  
✅ No empty date values  
✅ Date column persists across multiple exports  

---

## Test 3: PDF Export with Month/Year Selection

### Objective
Verify that users can select a specific month and year in Settings, and the PDF export will only include expenses from that period.

### Prerequisites
- SpendSense application is running
- User is logged in
- At least 10 expenses spanning multiple months exist in the system

### Test Steps

#### Step 3.1: Create Multi-Month Test Data (if needed)
1. In Dashboard, create expenses across multiple months:
   - January 2024: 3-4 expenses
   - February 2024: 3-4 expenses
   - March 2024: 3-4 expenses
   - March 2025: 2-3 expenses
2. Verify expenses appear in the Dashboard with correct dates

#### Step 3.2: Access PDF Export Settings
1. Go to Settings tab
2. Scroll down to "📊 Data & Export" section
3. Locate "PDF Report Period" subsection
4. Verify the following elements are present:
   - Month dropdown (#pdf-export-month)
   - Year dropdown (#pdf-export-year)
   - "Export PDF" button (#export-pdf-with-period-btn)

#### Step 3.3: Test Default Values
1. Check the Month dropdown default value
   - **Expected:** Current month (e.g., if today is March 15, 2025, default should be "03")
2. Check the Year dropdown default value
   - **Expected:** Current year (e.g., 2025)

#### Step 3.4: Test PDF Export - February 2024
1. Click on Month dropdown, select "February"
2. Click on Year dropdown, select "2024"
3. Click "📄 Export PDF" button
4. Save the file as "SpendSense_Report_February_2024.pdf"
5. **Expected filename format:** SpendSense_Report_[Month]_[Year].pdf

#### Step 3.5: Verify PDF Content - February Only
1. Open the generated PDF file
2. Check the header/title section:
   - Should contain "SpendSense Financial Report"
   - Should contain "Period: February 2024"
3. Check the expense table:
   - **Expected:** Only expenses from February 2024 should be listed
   - Should NOT include January or March expenses
4. Check the total at the bottom:
   - Should only sum expenses from February 2024
5. Verify all expenses shown have dates in February 2024

#### Step 3.6: Test PDF Export - March 2025
1. Go back to Settings
2. Select Month = "March", Year = "2025"
3. Click "📄 Export PDF"
4. Save as "SpendSense_Report_March_2025.pdf"

#### Step 3.7: Verify PDF Content - March 2025
1. Open the new PDF file
2. Check the header:
   - Should contain "Period: March 2025"
3. Check the expense table:
   - Should only include March 2025 expenses
   - Should NOT include March 2024 or other months
4. Verify the filename is correct: "SpendSense_Report_March_2025.pdf"

#### Step 3.8: Test Edge Cases
1. Select a month with no expenses (e.g., if user has no September expenses)
2. Click "📄 Export PDF"
3. **Expected Result:** PDF should still generate with headers and 0 total, but no expense rows

#### Step 3.9: Test Year Range
1. Click on Year dropdown
2. **Expected:** Should show years from (current year - 5) to (current year + 5)
3. Example: If current year is 2025, dropdown should show 2020-2030
4. Select different years and verify the dropdown works

#### Step 3.10: Test Multiple Exports
1. Export PDF for January 2024
2. Export PDF for March 2025
3. Export PDF for current month
4. **Expected:** Each file should have the correct month/year in:
   - Filename
   - PDF header content
   - Expense table data (only matching period)

### Success Criteria
✅ Month dropdown exists and defaults to current month  
✅ Year dropdown exists, defaults to current year, and shows 11-year range  
✅ Export button triggers PDF download with correct filename  
✅ PDF header shows correct period (e.g., "Period: February 2024")  
✅ PDF only includes expenses from selected month/year  
✅ PDF totals are calculated only for selected period  
✅ No expenses from other months appear in PDF  
✅ Works for multiple month/year combinations  

---

## Integration Test: All Three Fixes Together

### Test Steps
1. **Phase 1:** Add a new category in Settings (Test 1)
2. **Phase 2:** Create an expense in Dashboard with the new category
3. **Phase 3:** Select a month/year in Settings and export PDF (Test 3)
4. **Phase 4:** Export CSV (Test 2)
5. **Verify:**
   - New category appears in both Dashboard dropdown and PDF
   - CSV includes the new expense with correct date
   - PDF only includes expenses from selected period
   - All three features work together seamlessly

---

## Troubleshooting

### Issue: New categories don't appear in Dashboard dropdown
- **Solution:** Check that `loadCategoriesFromServer()` is being called after category is added
- **Debug:** Open browser console, check for errors in `/api/settings/categories` endpoint

### Issue: CSV file is empty or missing date column
- **Solution:** Verify that `/api/expenses/export` endpoint includes `date` in the SELECT statement
- **Debug:** Check app.py line ~2174 for CSV schema

### Issue: PDF doesn't filter by month/year
- **Solution:** Verify that `month` and `year` query parameters are being passed to `/api/export/pdf`
- **Debug:** Check browser Network tab, verify URL contains `?month=XX&year=YYYY`

### Issue: Year dropdown is empty or not populated
- **Solution:** Check browser console for JavaScript errors in `initPDFExportPeriod()`
- **Debug:** Verify that `pdf-export-year` element exists in settings.html

---

## Files Modified

- **Backend:** `app.py`
  - Line 1670-1800: Updated `/api/export/pdf` endpoint to accept `month` and `year` parameters
  
- **Frontend - Settings:** `static/js/settings.js`
  - Line 133: Added event listener for `#export-pdf-with-period-btn`
  - Line 132: Added call to `initPDFExportPeriod()`
  - Line 570-603: Added `initPDFExportPeriod()` function to populate year dropdown
  - Line 606-619: Added `exportPDFWithPeriod()` function to handle PDF export with period
  
- **Frontend - Dashboard:** `static/js/app.js`
  - Line 134-139: Added `globalCategories` object as single source of truth
  - Line 172-176: Added event listener for `categoriesUpdated` event
  - Line 242-255: Added `loadCategoriesFromServer()` function
  - Line 260-275: Added `populateExpenseFormCategories()` function
  - Line 480-483: Updated `showApp()` to load categories before expenses
  
- **Frontend - Settings HTML:** `templates/settings.html`
  - Line 205-240: Added "📊 Data & Export" section with PDF Report Period selector

---

## Expected Behavior Summary

| Feature | Current Behavior | Expected Behavior |
|---------|-------------------|-------------------|
| **Category Sync** | Categories added in Settings might not appear in Dashboard | Categories appear instantly in all dropdowns |
| **CSV Date** | CSV might be missing date column | CSV includes date column as first column |
| **PDF Export** | PDF uses current month only | PDF uses user-selected month/year from Settings |

---

## Sign-Off

- [ ] All Test 1 (Categories Sync) tests pass
- [ ] All Test 2 (CSV Date) tests pass
- [ ] All Test 3 (PDF Period) tests pass
- [ ] Integration test passes
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] Features work as documented

**Tested by:** _________________  
**Date:** _________________  
**Notes:** _________________
