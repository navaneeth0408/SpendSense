# Advanced Analytics Features - SpendSense

This document outlines all the advanced analytics features added to the SpendSense application.

## 🎯 Features Implemented

### 1. **Advanced Time Filters** ⏰
The analytics page now includes flexible time range selection:

**Preset Ranges:**
- Last 7 Days
- Last 30 Days (default)
- Last 3 Months
- Last 6 Months
- This Year

**Custom Range:**
- Date picker for start date
- Date picker for end date
- Apply button to load data for custom range

**Visual Feedback:**
- Active filter button is highlighted
- All charts and metrics update in real-time when range changes

**API Support:**
- Backend accepts `start_date` and `end_date` query parameters in YYYY-MM-DD format
- All analytics endpoints respect the selected date range

---

### 2. **🚨 Spending Alerts (Expense Spike Detector)**
Automatically detects days with unusual spending patterns.

**How It Works:**
- Calculates average daily spending
- Identifies days where spending exceeds 3× the average
- Shows top 5 spending spikes

**Display:**
- 🚨 Alert icon
- Date of spike
- Amount spent
- Multiple of average (e.g., "6.8× your normal day")
- Clickable to drill down into transactions

**Backend API:**
- Endpoint: `/api/analytics/spike-detector`
- Returns: List of spike days with amount and multiple

---

### 3. **🔮 Spending Forecast**
Projects your spending for the rest of the month based on current trends.

**Features:**
- Shows projected total spending at current rate
- Compares against set budget
- Displays days elapsed and remaining
- Status indicators: On Track / Caution / Over Budget
- Visual progress bar with color coding

**Color Coding:**
- 🟢 Green (≤80% budget) - On Track
- 🟡 Orange (80-100% budget) - Caution
- 🔴 Red (>100% budget) - Over Budget

**Backend API:**
- Endpoint: `/api/analytics/forecast`
- Returns: Projection data with budget comparison

---

### 4. **📊 Period Comparison Engine**
Compare spending across different time periods to understand trends.

**Comparison Types:**
- This Month vs Last Month
- This 3 Months vs Previous 3 Months
- This Year vs Last Year

**Metrics Shown:**
- Total spending change (amount and percentage)
- Per-category growth/reduction
- Trend direction (↑ or ↓)
- Color-coded indicators:
  - 🟢 Green: Spending reduced
  - 🔴 Red: Spending increased

**Backend API:**
- Endpoint: `/api/analytics/comparison?type=month|3months|year`
- Returns: Category-wise and total comparison data

---

### 5. **📥 Export & Reports**

#### Excel Export (.xlsx)
- Sheets included:
  - **Transactions**: All transactions in date range with category, amount, notes
  - **Category Totals**: Summary by category
  - **Daily Totals**: Daily spending aggregated

**API:**
- Endpoint: `/api/analytics/export/excel`
- Returns: Excel file download

#### PDF Export
- Includes:
  - Report title with date range
  - Overview metrics (total, average, budget)
  - Top 10 categories breakdown
  - Budget utilization summary

**API:**
- Endpoint: `/api/analytics/export/pdf`
- Returns: PDF file download

**Requirements:**
- openpyxl (for Excel)
- reportlab (for PDF)

---

## 🔧 Backend Implementation

### New API Endpoints

```
GET /api/analytics/spike-detector
  Query: start_date, end_date
  Returns: { spikes[], average_daily, spike_threshold }

GET /api/analytics/forecast
  Returns: { spent_so_far, projected_total, budget, days_elapsed, days_remaining, status }

GET /api/analytics/comparison
  Query: type (month|3months|year)
  Returns: { comparison[], total_current, total_previous, total_growth, period_type }

GET /api/analytics/export/excel
  Query: start_date, end_date
  Returns: .xlsx file

GET /api/analytics/export/pdf
  Query: start_date, end_date
  Returns: .pdf file
```

### Updated Endpoints

**GET /api/analytics**
- Now accepts `start_date` and `end_date` query parameters
- Format: YYYY-MM-DD
- Backward compatible with existing filters

---

## 🎨 Frontend Implementation

### New JavaScript Functions

```javascript
// Initialize filters and set defaults
initSelectors()

// Get date range for preset filters
getDateRange(filterType)

// Format dates for API calls
formatDateForInput(date)

// Render spending alerts
renderSpendingAlerts(data)

// Render forecast card
renderSpendingForecast(data)

// Render period comparison
renderPeriodComparison(data)

// Export functions
exportToExcel()
exportToPdf()
```

### Updated Functions

- `loadAnalytics()` - Now fetches multiple endpoints in parallel
- `showDrilldown()` - Updated to use currentStartDate/currentEndDate
- `getAnalyticsUrl()` - Returns URL with date range parameters

---

## 📊 Data Flow

1. **User selects time range**
   ↓
2. **Frontend updates currentStartDate/currentEndDate**
   ↓
3. **loadAnalytics() fetches multiple API endpoints in parallel:**
   - /api/analytics (main metrics)
   - /api/analytics/comparison (period comparison)
   - /api/analytics/spike-detector (spending alerts)
   - /api/analytics/forecast (forecast)
   ↓
4. **Frontend renders all components with received data**
   ↓
5. **User can interact: click alerts for drilldown, export, etc.**

---

## 💾 Database Requirements

No schema changes required. All features use existing expense and budget tables.

---

## 📦 Dependencies

### New Python Packages
- `openpyxl==3.10.0` - Excel generation
- `reportlab==4.0.4` - PDF generation

### Existing
- Flask
- flask-bcrypt
- python-dateutil

---

## 🚀 Usage Examples

### Select Time Range
```javascript
// Via preset button (automatic)
User clicks "Last 3 Months" button
→ currentStartDate/currentEndDate updated
→ loadAnalytics() called

// Via custom range
User enters dates and clicks Apply
→ currentStartDate/currentEndDate updated
→ loadAnalytics() called
```

### View Spending Spike
```
Spending Alerts card shows: 🚨 Dec 24: ₹45,450 (6.8× your normal day)
User clicks on alert
→ Drilldown modal opens with all transactions from that day
```

### Check Forecast
```
Spending Forecast shows:
"At this rate, you will spend ₹72,400 this month (₹65,000 budget) - Over Budget"
Progress bar shows 111% filled in red
```

### Compare Periods
```
Period Comparison shows:
Total spending change: ↑ 15.3% higher than last month
By category:
- Shopping: ↑ 25% (was ₹5,000 → now ₹6,250)
- Food: ↓ 10% (was ₹8,000 → now ₹7,200)
```

### Export Data
```
User clicks Excel button
→ /api/analytics/export/excel API called
→ Browser downloads analytics.xlsx with 3 sheets

User clicks PDF button
→ /api/analytics/export/pdf API called
→ Browser downloads analytics.pdf with summary
```

---

## ✨ Visual Enhancements

### Color Scheme
- 🟢 Green (#22c55e) - Positive (reduced spending)
- 🟡 Orange (#f59e0b) - Warning (caution level)
- 🔴 Red (#ef4444) - Danger (over budget/spike)
- 🔵 Blue (#2563eb) - Primary (forecasts)

### Icons
- 🚨 Spending Alerts
- 🔮 Forecast
- 📊 Comparison
- ↑ ↓ Trend indicators

---

## 🔒 Security

- All endpoints require authentication (`@login_required`)
- User can only see their own data
- Date range validation on backend

---

## 📝 Notes

- Default range is "Last 30 Days" when analytics page loads
- All calculations are done server-side for accuracy
- Export files are generated on-the-fly (no storage)
- Forecast updates daily as new data is entered

---

## 🐛 Troubleshooting

### Excel export not working
- Ensure openpyxl is installed: `pip install openpyxl`
- Check browser for download prompt

### PDF export fails
- Ensure reportlab is installed: `pip install reportlab`
- Check system has write permissions for temp files

### No data showing
- Verify date range includes expense records
- Check user has expenses in database
- Ensure budget is set for comparison features

---

## 🎓 Technical Details

### Spike Detection Algorithm
```
avg = sum(daily_spending) / days
threshold = avg × 3
spikes = [days where amount > threshold]
```

### Forecast Calculation
```
days_elapsed = (today - month_start).days + 1
daily_average = spent_so_far / days_elapsed
projected_total = daily_average × days_in_month
```

### Period Comparison
```
growth = ((current - previous) / previous) × 100
trend = "up" if growth > 0 else "down"
```

---

## 📅 Last Updated
January 12, 2026

## 👨‍💻 Implementation Status
✅ All features implemented and tested

