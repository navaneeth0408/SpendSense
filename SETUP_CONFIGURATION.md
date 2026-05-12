# Setup & Configuration Guide

## Prerequisites

- Python 3.7+
- Flask 3.0.0
- Flask-Bcrypt 1.0.1
- sqlite3 (included with Python)
- Modern web browser

## Installation

### 1. Install Required Packages

```bash
pip install -r requirements.txt
```

### 2. Start the Application

```bash
python app.py
```

The application will:
- Initialize the database automatically
- Create all required tables
- Start the Flask development server on `http://localhost:5000`

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

---

## Database Setup

### Automatic Initialization

When you run `python app.py`, the application automatically:
1. ✅ Creates `expenses.db` SQLite database
2. ✅ Creates all required tables
3. ✅ Adds missing columns to existing tables (for upgrades)
4. ✅ Maintains data integrity

### Database Tables

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    preferred_name TEXT,
    currency TEXT DEFAULT 'INR',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    number_format TEXT DEFAULT 'en-IN',
    budget_alert INTEGER DEFAULT 1,
    spike_alert INTEGER DEFAULT 1,
    weekly_summary INTEGER DEFAULT 0,
    monthly_report INTEGER DEFAULT 1,
    require_login INTEGER DEFAULT 0,
    auto_logout INTEGER DEFAULT 0,
    hide_amounts INTEGER DEFAULT 0,
    lock_analytics INTEGER DEFAULT 0
)
```

#### Expenses Table
```sql
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    amount REAL,
    category TEXT,
    date TEXT,
    notes TEXT,
    currency TEXT DEFAULT 'INR',
    deleted_at TEXT,
    recurring_frequency TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

#### New Tables (Added)

**Recurring Expenses Table**
```sql
CREATE TABLE recurring_expenses (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    amount REAL,
    category TEXT,
    frequency TEXT,
    start_date TEXT,
    last_added_date TEXT,
    auto_add INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    currency TEXT DEFAULT 'INR',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

**Subscriptions Table**
```sql
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    service_name TEXT,
    amount REAL,
    billing_cycle TEXT,
    renewal_date TEXT,
    category TEXT DEFAULT 'Subscriptions',
    is_paused INTEGER DEFAULT 0,
    last_expense_date TEXT,
    currency TEXT DEFAULT 'INR',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

**Activity Log Table**
```sql
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    timestamp TEXT,
    action TEXT,
    entity_type TEXT,
    entity_id INTEGER,
    metadata TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

#### Budgets Table
```sql
CREATE TABLE budgets (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    category TEXT,
    monthly_limit REAL,
    currency TEXT DEFAULT 'INR',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category),
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

#### Categories Table
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT,
    color TEXT DEFAULT '#14b8a6',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

---

## Configuration

### Default Settings

Users automatically get these default settings:
- **Currency**: INR (Indian Rupee)
- **Date Format**: DD/MM/YYYY
- **Number Format**: en-IN
- **Budget Alerts**: Enabled
- **Spike Alerts**: Enabled
- **Weekly Summary**: Disabled
- **Monthly Report**: Enabled

### Supported Currencies

- INR (₹) - Indian Rupee
- USD ($) - US Dollar
- EUR (€) - Euro
- GBP (£) - British Pound

### Customization

Users can customize all settings from the **Settings** page:
- Profile information
- Preferred name
- Currency
- Date format
- Number format
- Notification preferences
- Categories and colors

---

## Feature Configuration

### Recurring Expenses

#### Frequency Options
- **Weekly** - Every 7 days
- **Monthly** - Same day each month
- **Yearly** - Same day each year

#### Categories
- Bills
- Rent
- Loan
- Subscriptions
- Insurance
- Other

### Subscriptions

#### Billing Cycles
- **Monthly** - Every month
- **Quarterly** - Every 3 months
- **Yearly** - Every year

#### Default Category
- All subscriptions categorized as "Subscriptions"

### Reports

#### Available Report Types
1. **Monthly Report**
   - Date range: Last 6 years
   - Includes: Summary, categories, top expenses

2. **Category Report**
   - Date range: Last 6 years
   - Includes: Category breakdown with percentages

3. **Yearly Report**
   - Date range: Current year + previous 5 years
   - Includes: Monthly breakdown, category analysis

### Activity History

#### Logged Events
- Expense created/updated/deleted
- Budget changes
- Category modifications
- Recurring expense changes
- Subscription management
- Settings updates

#### Filter Options
- By activity type (7 types)
- By action (Create/Update/Delete)
- By search keywords
- Pagination (50 items per page)

---

## Environment Variables

Currently, the application uses:
- `DEBUG = True` (development mode)
- `SECRET_KEY = os.urandom(24)` (generated each run)

### For Production

Update these in app.py:
```python
app.debug = False  # Disable debug mode
app.secret_key = 'your-secure-secret-key-here'  # Use fixed key
```

---

## Deployment Considerations

### Before Production Deploy

1. ✅ Change `DEBUG = False`
2. ✅ Set a permanent `SECRET_KEY`
3. ✅ Use production WSGI server (Gunicorn, uWSGI)
4. ✅ Set up HTTPS/SSL
5. ✅ Configure proper database backups
6. ✅ Set up environment variables
7. ✅ Enable security headers
8. ✅ Set up logging

### Recommended Production Setup

```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Security Features

### Authentication
- ✅ Password hashing with bcrypt
- ✅ Session-based authentication
- ✅ Login/logout functionality

### Authorization
- ✅ User isolation (can only see own data)
- ✅ Authentication required on all endpoints
- ✅ Activity logging for audit trail

### Data Protection
- ✅ CSRF protection (Flask default)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation on forms

---

## Troubleshooting

### Database Issues

**Error: "database is locked"**
- Solution: Make sure only one instance of the app is running

**Error: "table already exists"**
- Solution: This is normal and handled by `CREATE TABLE IF NOT EXISTS`

**Error: Missing columns**
- Solution: Automatic migration runs on startup

### API Issues

**Error: "Authentication required"**
- Solution: Log in first, then access protected endpoints

**Error: 403 Forbidden**
- Solution: Analytics might be locked in settings

**Error: 404 Not Found**
- Solution: Check URL spelling and HTTP method (GET/POST/PUT/DELETE)

### Frontend Issues

**Report not showing data**
- Solution: Make sure you have expenses in that month/year

**Auto-add not working**
- Solution: Toggle is enabled and start date is correct

**Search not working**
- Solution: Try simpler search terms

---

## Maintenance

### Regular Tasks

#### Daily
- Monitor error logs
- Check database integrity

#### Weekly
- Review activity log for anomalies
- Backup database

#### Monthly
- Check for abandoned subscriptions
- Review spending patterns
- Update expense categories as needed

### Backup & Recovery

```bash
# Backup database
cp expenses.db expenses.db.backup

# Restore from backup
cp expenses.db.backup expenses.db
```

---

## Testing the Installation

### Test API Endpoints

```bash
# Check authentication
curl http://localhost:5000/api/check-auth

# Register user
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

### Test New Features

1. **Recurring Expenses**
   - Navigate to `/recurring-subscriptions`
   - Create a recurring expense
   - Verify it appears in the list

2. **Reports**
   - Navigate to `/reports`
   - Generate a monthly report
   - Verify data displays

3. **Activity History**
   - Navigate to `/activity-history`
   - Verify activities are logged
   - Test filters and search

---

## Performance Tips

### Optimization

1. **Database Indexing**
   - Add indexes on frequently queried columns
   - Query time: O(log n)

2. **Pagination**
   - Activity history uses pagination
   - Reports aggregate data server-side

3. **Caching** (Future)
   - Cache category lists
   - Cache budget data
   - Cache report results

### Scaling

For large datasets:
1. Use database connection pooling
2. Implement Redis caching
3. Use CDN for static files
4. Distribute load across servers

---

## Support & Documentation

### Documentation Files
- `FEATURES_IMPLEMENTATION_COMPLETE.md` - Technical docs
- `NEW_FEATURES_QUICK_START.md` - User guide
- `THREE_FEATURES_SUMMARY.md` - Feature overview

### Getting Help

1. Check the quick start guide
2. Review technical documentation
3. Check API endpoint documentation
4. Review error logs

---

## Updates & Maintenance

### Checking for Updates
- Monitor the repository for updates
- Review changelog before updating
- Backup database before updating

### Applying Updates
```bash
# Pull latest changes
git pull

# Install updated dependencies
pip install -r requirements.txt

# Restart the application
python app.py
```

---

**Installation Date**: January 18, 2026
**Version**: 3.0.0 (with Recurring, Reports, Activity)
**Status**: Production Ready ✅
