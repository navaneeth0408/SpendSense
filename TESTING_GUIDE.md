# Testing Guide - Advanced Analytics Features

## Prerequisites
1. Start the Flask app: `python app.py`
2. Login to SpendSense
3. Have some expense data in your account (create a few test expenses)
4. Navigate to Analytics page

## Feature Testing Checklist

### 1. Time Range Filters ⏰
- [ ] Click "Last 7 Days" button - charts should update
- [ ] Click "Last 30 Days" button - charts should update
- [ ] Click "Last 3 Months" button - charts should update
- [ ] Click "Last 6 Months" button - charts should update
- [ ] Click "This Year" button - charts should update
- [ ] Buttons should show visual "active" state (highlighted)
- [ ] Date inputs should show corresponding dates
- [ ] Enter custom start and end dates
- [ ] Click "Apply" - charts should update
- [ ] Verify all metrics change based on selected range

### 2. Spending Alerts (Spike Detector) 🚨
- [ ] Card titled "🚨 Spending Alerts" appears on page
- [ ] If you have spikes (day with >3x average spending), they should display
- [ ] Each spike shows:
  - [ ] 🚨 icon
  - [ ] Date
  - [ ] Amount (₹)
  - [ ] Multiple (e.g., "6.8×")
- [ ] Click on a spike
- [ ] Drilldown modal opens showing transactions from that day
- [ ] "No spending spikes detected" message appears if no spikes

### 3. Spending Forecast 🔮
- [ ] Card titled "🔮 Spending Forecast" appears
- [ ] Shows projected monthly total
- [ ] Shows budget comparison
- [ ] Progress bar displays filling status
- [ ] Status shows as:
  - [ ] "On Track" (green) if ≤80% of budget
  - [ ] "Caution" (orange) if 80-100% of budget
  - [ ] "Over Budget" (red) if >100% of budget
- [ ] Shows days elapsed and remaining

### 4. Period Comparison 📊
- [ ] Card titled "📊 Period Comparison" appears
- [ ] Shows total spending change vs previous period
- [ ] Shows percentage change with ↑ or ↓ indicator
- [ ] Lists top categories with:
  - [ ] Category name
  - [ ] Current amount
  - [ ] Previous amount
  - [ ] Growth percentage
  - [ ] Trend indicator (↑ red for increase, ↓ green for decrease)

### 5. Export to Excel 📥
- [ ] "Excel" button appears in filter bar
- [ ] Click Excel button
- [ ] Browser downloads "analytics.xlsx" file
- [ ] Open Excel file and verify:
  - [ ] "Transactions" sheet with all transactions
  - [ ] "Category Totals" sheet with summary
  - [ ] "Daily Totals" sheet with daily aggregates
  - [ ] Data matches selected date range

### 6. Export to PDF 📄
- [ ] "PDF" button appears in filter bar
- [ ] Click PDF button
- [ ] Browser downloads "analytics.pdf" file
- [ ] Open PDF and verify:
  - [ ] Title "Spending Analytics Report"
  - [ ] Date range shown
  - [ ] Overview metrics table
  - [ ] Top categories table
  - [ ] Budget information

### 7. Integration & Updates
- [ ] Change date range
  - [ ] All cards update (alerts, forecast, comparison)
  - [ ] Charts update
  - [ ] Metrics recalculate
- [ ] Add new expense via dashboard
- [ ] Return to analytics
- [ ] New expense should appear in selected range
- [ ] Metrics should update accordingly

## Test Scenarios

### Scenario 1: Normal Spending
1. Enter expenses uniformly across several days (~₹1000/day)
2. Add one spike day (~₹5000)
3. Expected:
   - Spike should show in Spending Alerts
   - Forecast should show reasonable projection
   - Comparison should show trends

### Scenario 2: Over Budget
1. Set budget of ₹50,000
2. Create expenses totaling >₹50,000
3. Expected:
   - Forecast status: "Over Budget" (red)
   - Progress bar: >100%
   - Spike alerts if any day >3x average

### Scenario 3: Period Comparison
1. Create expenses in current month (₹30,000)
2. Check last month's spending (~₹20,000)
3. Expected:
   - Comparison shows ↑ 50%
   - Red trend indicator

## Browser Console Checks
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Verify no errors (should see analytics data logs)
4. Check Network tab for API calls:
   - [ ] /api/analytics (should succeed)
   - [ ] /api/analytics/spike-detector (should succeed)
   - [ ] /api/analytics/forecast (should succeed)
   - [ ] /api/analytics/comparison (should succeed)

## API Testing (Optional - Using curl/Postman)

```bash
# Test spike detector
curl "http://127.0.0.1:5000/api/analytics/spike-detector?start_date=2026-01-01&end_date=2026-01-12"

# Test forecast
curl "http://127.0.0.1:5000/api/analytics/forecast"

# Test comparison
curl "http://127.0.0.1:5000/api/analytics/comparison?type=month"

# Test Excel export
curl -O "http://127.0.0.1:5000/api/analytics/export/excel?start_date=2026-01-01&end_date=2026-01-12"

# Test PDF export
curl -O "http://127.0.0.1:5000/api/analytics/export/pdf?start_date=2026-01-01&end_date=2026-01-12"
```

## Performance Notes
- Dashboard should load within 2 seconds
- Chart rendering should be smooth
- Export files should generate within 3 seconds
- No memory leaks in browser console

## Known Limitations
- Forecast is based on month calendar (not customizable periods)
- Spike detection threshold is fixed at 3x average
- Comparison is fixed at specific period types
- PDF generation requires valid category data

## Feedback
If you find any issues:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Verify date ranges selected
4. Check that expense data exists for range
5. Report with screenshot if possible

---

Last Updated: January 12, 2026
