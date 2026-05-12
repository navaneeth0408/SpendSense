# Quick Start Guide - New Features 🚀

## 💳 Recurring Expenses & Subscriptions

### Add a Recurring Expense
1. Navigate to **Recurring & Subscriptions**
2. Fill in the form:
   - **Name**: e.g., "Rent", "Internet Bill"
   - **Amount**: e.g., 15000
   - **Category**: Bills, Rent, Loan, etc.
   - **Frequency**: Monthly, Weekly, or Yearly
   - **Start Date**: When the expense begins
   - **Auto-add**: Toggle to auto-add on due date
3. Click **Add Recurring Expense**

**Result**: Expense appears in list with next due date and countdown

### Add a Subscription
1. Navigate to **Recurring & Subscriptions**
2. Fill in the Subscriptions form:
   - **Service Name**: e.g., "Netflix", "Spotify"
   - **Amount**: Monthly cost
   - **Billing Cycle**: Monthly, Quarterly, or Yearly
   - **Renewal Date**: Next renewal date
3. Click **Add Subscription**

**Features**:
- See total monthly cost at a glance
- Red flag for upcoming renewals (within 7 days)
- Pause subscriptions without deleting
- Flag unused subscriptions (no expense in 60 days)

---

## 📊 Reports

### Generate a Monthly Report
1. Navigate to **Reports**
2. Select **Monthly Report** tab (already selected)
3. Choose **Month** and **Year**
4. Click **Generate**

**You get**:
- Total expenses for that month
- Category breakdown
- Top 10 expenses
- Transaction count per category

### Generate Category Report
1. Click **Category Breakdown** tab
2. Select **Month** and **Year**
3. Click **Generate**

**You get**:
- How much spent per category
- Percentage of total for each
- Visual percentage bars
- Transaction count

### Generate Yearly Summary
1. Click **Yearly Summary** tab
2. Select **Year**
3. Click **Generate**

**You get**:
- Total yearly expenses
- Average monthly spending
- Month-by-month breakdown
- Top categories for the year

### Export Reports
After generating any report:
- **Download PDF**: Get a professional PDF file
- **Export Excel**: Get data in Excel spreadsheet

---

## 🧾 Activity History

### View Your Activity Timeline
1. Navigate to **Activity** page
2. See complete timeline of all actions
3. Each entry shows:
   - 🎯 What happened (Created, Updated, Deleted)
   - 📁 What type (Expense, Budget, Subscription, etc.)
   - ⏰ When (relative time: "5m ago", "2h ago")

### Filter Activities
**By Type**:
- All Activities / Expenses / Budget / Categories / Settings / Recurring / Subscriptions

**By Action**:
- All Actions / Created / Updated / Deleted

**By Search**:
- Type keywords to search all activities
- Searches action, entity, and details

### Activity Summary
- See total number of activities
- Most common action type
- Most tracked category

---

## 🎯 Common Tasks

### Track Rent Payment (Recurring)
1. Go to **Recurring & Subscriptions**
2. Create Recurring:
   - Name: "Rent"
   - Amount: 25000
   - Category: Rent
   - Frequency: Monthly
   - Start Date: [Today's date]
   - Auto-add: ON
3. Done! ✅ Rent auto-adds each month

### Monitor All Subscriptions Cost
1. Go to **Recurring & Subscriptions**
2. Look at **Total Monthly Cost** in Subscriptions section
3. Instantly see if spending on subscriptions is growing

### Check Where Money Goes
1. Go to **Reports**
2. Select **Category Breakdown**
3. Choose current month
4. Click **Generate**
5. See exact breakdown of spending by category

### Find When Subscription Renews
1. Go to **Recurring & Subscriptions**
2. Find subscription in list
3. Red number = days until renewal
4. Red highlight = urgent (within 7 days)

### See All Changes You Made
1. Go to **Activity** page
2. See timestamped list of everything
3. Filter by type to see specific actions
4. Search for specific items

---

## 💡 Pro Tips

**Recurring Expenses**:
- Set start date to your actual payment date for accurate "next due" calculations
- Use auto-add to eliminate manual entry
- Check next due date column for upcoming payments

**Subscriptions**:
- Set billing cycle to match your subscription (Monthly = monthly charge)
- Update renewal date when subscription charges
- Pause instead of delete to keep history

**Reports**:
- Generate monthly reports on your payday
- Compare months to see trends
- Export to Excel for deeper analysis
- Use for budget planning

**Activity History**:
- Search for specific items if you forget when you did something
- Use filters to focus on specific types of changes
- Check activity summary to understand usage patterns

---

## ⚙️ Settings You Should Know

All new features respect your existing settings:
- **Currency**: All forms use your selected currency
- **Dark Mode**: Works on all new pages
- **Theme**: Consistent with your dashboard

---

## ❓ FAQ

**Q: Does auto-add create a duplicate expense?**
A: No, auto-add checks the last_added_date to prevent duplicates.

**Q: Can I delete activity history?**
A: No, activity log is read-only for audit purposes (security feature).

**Q: What's the difference between Recurring Expenses and Subscriptions?**
A: Recurring = bills/loans you pay. Subscriptions = digital services you subscribe to.

**Q: Can I pause a subscription instead of deleting?**
A: Yes! Click the pause button to temporarily disable without losing history.

**Q: How far back do reports go?**
A: Reports work for the current year and previous 5 years.

**Q: Is my activity logged?**
A: Yes, all actions (create/update/delete) are logged in Activity History.

---

## 🆘 Need Help?

- **Reports not showing data?** Make sure you have expenses in that month/year
- **Auto-add not working?** Check that the date is correct and toggle is ON
- **Can't find an activity?** Use search or filter by type
- **Export not working?** Try PDF first, then Excel

---

**Happy tracking! 🎉**

For detailed documentation, see `FEATURES_IMPLEMENTATION_COMPLETE.md`
