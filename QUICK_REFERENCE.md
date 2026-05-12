# Quick Reference - Advanced Analytics Features

## 🚀 Quick Start

### View Analytics
1. Navigate to `/analytics`
2. Page loads with **last 30 days** by default
3. All charts and metrics display automatically

### Change Time Range

**Preset Options:**
```
[Last 7 Days] [Last 30 Days] [Last 3 Months] [Last 6 Months] [This Year]
```
Just click any button - everything updates instantly!

**Custom Range:**
```
Start Date: [Pick Date] → End Date: [Pick Date] → [Apply]
```

### 🚨 Spending Alerts
Shows days where you spent 3× or more than your average:
```
🚨 Dec 24: ₹45,450 (6.8× your normal day)
```
Click it → See all transactions from that day

### 🔮 Spending Forecast
Projects what you'll spend this month at current rate:
```
Projected: ₹72,400 | Budget: ₹65,000 | Status: Over Budget 🔴
Progress: ████████░░ 111% | Days Left: 18
```

### 📊 Period Comparison
Compares this period vs last period:
```
Total Change: ↑ 15.3% higher
By Category:
- Food: ↓ 10% (was ₹8,000 → ₹7,200) 🟢
- Shopping: ↑ 25% (was ₹5,000 → ₹6,250) 🔴
```

### 📥 Export Data

**Excel (.xlsx)**
- All transactions in detail
- Category summaries
- Daily totals
```
Click: [Excel] → Downloads analytics.xlsx
```

**PDF Report (.pdf)**
- Executive summary
- Top categories
- Budget overview
```
Click: [PDF] → Downloads analytics.pdf
```

---

## 📊 Reading the Metrics

### Spending Alert (Spike)
| Symbol | Meaning |
|--------|---------|
| 🚨 | Unusual spending day |
| 6.8× | 6.8 times your daily average |
| ₹45,450 | Amount spent that day |

### Forecast Status
| Status | Color | Meaning |
|--------|-------|---------|
| On Track | 🟢 Green | ≤80% of budget used |
| Caution | 🟡 Orange | 80-100% of budget |
| Over Budget | 🔴 Red | >100% of budget |

### Period Comparison
| Indicator | Meaning |
|-----------|---------|
| ↓ Green | Spending decreased |
| ↑ Red | Spending increased |
| % Number | Percentage change |

---

## 💡 Common Tasks

### "How much will I spend this month?"
→ Look at **Spending Forecast** card
→ See "Projected: ₹XX,XXX"

### "I had an unusual day last week. What happened?"
→ Check **Spending Alerts** card
→ Click on the date
→ See all transactions from that day

### "Am I spending more than last month?"
→ Select "Last 30 Days"
→ Check **Period Comparison** card
→ See growth % for each category

### "I need to send a report to my accountant"
→ Select desired date range
→ Click "PDF" button
→ Send downloaded PDF file

### "Export all my transactions"
→ Select date range
→ Click "Excel" button
→ Open in Excel/Sheets

### "Check budget status"
→ Look at **Spending Forecast**
→ See "Status" indicator
→ Red = over budget, Green = on track

---

## 🎯 Keyboard Shortcuts
(When date input is focused)
- Arrow keys: Navigate dates
- Enter: Apply custom range
- Escape: Close any modal

---

## 📞 Troubleshooting

### "No data showing"
✓ Verify you have expenses in selected date range
✓ Check that you're logged in
✓ Try different date range

### "Alerts not showing"
✓ Check if any day spending > 3× average
✓ Try selecting longer time period
✓ Add some test expenses with high amount

### "Export button not working"
✓ Check browser allow downloads
✓ Verify date range has data
✓ Try different file format (PDF vs Excel)

### "Forecast showing 'On Track' but seems wrong"
✓ Forecast updates daily
✓ Based on all month, not just current range
✓ Check actual budget amount set

---

## 💾 Data Retention
- All data stored in secure database
- User can only see own data
- Exports are temporary (generated when requested)
- 30+ days of history recommended for accurate insights

---

## 📈 Tips for Best Results

1. **Categorize expenses properly** - Affects spike detection and comparison
2. **Set realistic budgets** - Forecast compares against budget
3. **Review monthly** - Use Month vs Month comparison
4. **Check for spikes** - Investigate unusual days
5. **Export for records** - Keep monthly PDF backups

---

## 🔐 Privacy & Security
✓ All data encrypted in database
✓ Only your data shown
✓ Exports don't leave fingerprints
✓ Calculations done server-side (safe)

---

## 📱 Browser Support
✓ Chrome/Edge 90+
✓ Firefox 88+
✓ Safari 14+
✓ Mobile browsers supported

---

## 🎓 Understanding the Math

### Spike Detection
```
average daily spend = ₹10,000
spike threshold = ₹10,000 × 3 = ₹30,000
if (day spending > ₹30,000) → Alert!
```

### Forecast
```
days elapsed = 12 days
spent so far = ₹120,000
daily average = ₹120,000 ÷ 12 = ₹10,000/day

days in month = 31
projected = ₹10,000 × 31 = ₹310,000
```

### Comparison Growth
```
this month = ₹120,000
last month = ₹100,000
growth = ((₹120,000 - ₹100,000) ÷ ₹100,000) × 100 = +20%
```

---

## 🆘 Need Help?
1. Check ANALYTICS_FEATURES.md for detailed info
2. See TESTING_GUIDE.md for test scenarios
3. Check browser console (F12) for errors
4. Verify date ranges have data

---

**Version**: January 12, 2026
**Status**: Active & Ready to Use
**Last Updated**: January 12, 2026

