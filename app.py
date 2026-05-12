from flask import Flask, request, jsonify, session, render_template, Response
from flask_bcrypt import Bcrypt
import sqlite3
import os
from datetime import datetime, timedelta
from functools import wraps
import csv
import io
from dateutil.relativedelta import relativedelta
try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

app = Flask(__name__)

# ===== CRITICAL: Session Configuration =====
# Use a fixed secret key for persistent session handling in development
# For production, use os.environ.get('SECRET_KEY', os.urandom(24))
app.secret_key = 'spendsense-dev-secret-key-2026'  # Fixed key for development

# Configure session to be persistent and secure
app.config['SESSION_COOKIE_SECURE'] = False  # False for development (http), True for production (https)
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access to session cookie
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # Session expires in 7 days
app.config['SESSION_REFRESH_EACH_REQUEST'] = True  # Refresh session timeout on each request

bcrypt = Bcrypt(app)

DATABASE = 'expenses.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT,
            preferred_name TEXT,
            currency TEXT DEFAULT 'INR',
            date_format TEXT DEFAULT 'DD/MM/YYYY',
            number_format TEXT DEFAULT 'en-IN',
            budget_alert INTEGER DEFAULT 1,
            spike_alert INTEGER DEFAULT 1,
            weekly_summary INTEGER DEFAULT 0,
            monthly_report INTEGER DEFAULT 1
        )
    ''')
    
    # Ensure existing DB has settings columns (for upgrades)
    cursor.execute("PRAGMA table_info(users)")
    cols = [row[1] for row in cursor.fetchall()]
    if 'email' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
    if 'preferred_name' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN preferred_name TEXT")
    if 'currency' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'INR'")
    if 'date_format' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN date_format TEXT DEFAULT 'DD/MM/YYYY'")
    if 'number_format' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN number_format TEXT DEFAULT 'en-IN'")
    if 'budget_alert' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN budget_alert INTEGER DEFAULT 1")
    if 'spike_alert' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN spike_alert INTEGER DEFAULT 1")
    if 'weekly_summary' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN weekly_summary INTEGER DEFAULT 0")
    if 'monthly_report' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN monthly_report INTEGER DEFAULT 1")
    
    # Expenses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            currency TEXT NOT NULL DEFAULT 'INR',
            deleted_at TEXT DEFAULT NULL,
            recurring_frequency TEXT DEFAULT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    # Ensure existing DB has currency column (for upgrades)
    cursor.execute("PRAGMA table_info(expenses)")
    cols = [row[1] for row in cursor.fetchall()]
    if 'currency' not in cols:
        cursor.execute("ALTER TABLE expenses ADD COLUMN currency TEXT DEFAULT 'INR'")
    if 'deleted_at' not in cols:
        cursor.execute("ALTER TABLE expenses ADD COLUMN deleted_at TEXT DEFAULT NULL")
    if 'recurring_frequency' not in cols:
        cursor.execute("ALTER TABLE expenses ADD COLUMN recurring_frequency TEXT DEFAULT NULL")
    
    # Budgets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            monthly_limit REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'INR',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, category)
        )
    ''')
    
    # Categories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#14b8a6',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, name)
        )
    ''')
    
    # Ensure users table has security columns
    cursor.execute("PRAGMA table_info(users)")
    cols = [row[1] for row in cursor.fetchall()]
    if 'require_login' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN require_login INTEGER DEFAULT 0")
    if 'auto_logout' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN auto_logout INTEGER DEFAULT 0")
    if 'hide_amounts' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN hide_amounts INTEGER DEFAULT 0")
    if 'lock_analytics' not in cols:
        cursor.execute("ALTER TABLE users ADD COLUMN lock_analytics INTEGER DEFAULT 0")
    
    # Recurring Expenses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recurring_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            frequency TEXT NOT NULL,
            start_date TEXT NOT NULL,
            last_added_date TEXT,
            auto_add INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1,
            currency TEXT DEFAULT 'INR',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Subscriptions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            service_name TEXT NOT NULL,
            amount REAL NOT NULL,
            billing_cycle TEXT NOT NULL,
            renewal_date TEXT NOT NULL,
            category TEXT DEFAULT 'Subscriptions',
            is_paused INTEGER DEFAULT 0,
            last_expense_date TEXT,
            currency TEXT DEFAULT 'INR',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Activity History / Audit Log table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            metadata TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def log_activity(user_id, action, entity_type, entity_id=None, metadata=None):
    """Log user activity to audit log"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO activity_log (user_id, timestamp, action, entity_type, entity_id, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, datetime.now().isoformat(), action, entity_type, entity_id, metadata))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging activity: {e}")
        pass

def analytics_enabled(f):
    """Decorator to check if analytics is locked for the user"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = session['user_id']
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT lock_analytics FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if user and user['lock_analytics']:
            return jsonify({'error': 'Analytics access is locked', 'lock_analytics': True}), 403
        
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    return render_template('index.html', cache_buster=datetime.now().timestamp())


@app.route('/analytics')
@login_required
def analytics_page():
    # Render analytics dashboard page. Uses same session for user info.
    return render_template('analytics.html', cache_buster=datetime.now().timestamp())


@app.route('/settings')
@login_required
def settings_page():
    # Render settings page
    return render_template('settings.html', cache_buster=datetime.now().timestamp())

@app.route('/recurring-subscriptions')
@login_required
def recurring_subscriptions_page():
    # Render recurring expenses and subscriptions page
    return render_template('recurring_subscriptions.html', cache_buster=datetime.now().timestamp())

@app.route('/reports')
@login_required
def reports_page():
    # Render reports page
    return render_template('reports.html', cache_buster=datetime.now().timestamp())

@app.route('/activity-history')
@login_required
def activity_history_page():
    # Render activity history and audit log page
    return render_template('activity_history.html', cache_buster=datetime.now().timestamp())


def _parse_period_params():
    """Helper to parse month/year/quick/start_date/end_date into start_date and end_date (inclusive).
    Accepts either `quick` or `quickFilter` as query param for compatibility.
    Also accepts explicit start_date and end_date in YYYY-MM-DD format.
    """
    # Check for explicit start_date and end_date first
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if start_date_str and end_date_str:
        try:
            start = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            return start, end
        except ValueError:
            pass  # Fall through to other parsing methods
    
    month = request.args.get('month')
    year = request.args.get('year')
    quick = request.args.get('quick') or request.args.get('quickFilter')  # e.g., 'month', 'year', 'last-3-months'

    today = datetime.now().date()

    if quick == 'today':
        return today, today
    if quick == 'week' or quick == 'this_week':
        start = today - timedelta(days=6)
        return start, today
    if quick == 'last-3-months' or quick == 'last_3_months':
        start = (today.replace(day=1) - relativedelta(months=2)).replace(day=1)
        end = today
        return start, end
    if quick == 'this_month' or quick == 'month' or quick == 'this_month':
        start = today.replace(day=1)
        end = today
        return start, end
    if quick == 'this_year' or quick == 'year':
        start = datetime.strptime(f"{today.year}-01-01", '%Y-%m-%d').date()
        end = datetime.strptime(f"{today.year}-12-31", '%Y-%m-%d').date()
        return start, end

    # Default: if month and year provided, select that month
    if month and year:
        start = datetime.strptime(f"{year}-{month.zfill(2)}-01", '%Y-%m-%d').date()
        end = (start + relativedelta(months=1)) - timedelta(days=1)
        return start, end

    # If only year provided, use full year
    if year and not month:
        start = datetime.strptime(f"{year}-01-01", '%Y-%m-%d').date()
        end = datetime.strptime(f"{year}-12-31", '%Y-%m-%d').date()
        return start, end

    # Fallback to current month
    start = today.replace(day=1)
    end = today
    return start, end


@app.route('/api/analytics/overview', methods=['GET'])
@analytics_enabled
def api_analytics_overview():
    user_id = session['user_id']
    start_date, end_date = _parse_period_params()

    conn = get_db()
    cursor = conn.cursor()

    # Total spending
    cursor.execute('''
        SELECT COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    total = float(cursor.fetchone()['total'] or 0)

    # Average daily spending
    days = (end_date - start_date).days + 1
    avg_daily = total / days if days > 0 else 0

    # Highest spending category
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    row = cursor.fetchone()
    highest_category = row['category'] if row else None

    # Percentage change vs previous period (same length immediately before)
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days-1)

    cursor.execute('''
        SELECT COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
    ''', (user_id, prev_start.isoformat(), prev_end.isoformat()))
    prev_total = float(cursor.fetchone()['total'] or 0)

    pct_change = ((total - prev_total) / prev_total * 100) if prev_total > 0 else 0

    conn.close()

    return jsonify({
        'total': total,
        'average_daily': avg_daily,
        'highest_category': highest_category,
        'percentage_change': pct_change
    }), 200


@app.route('/api/analytics/categories', methods=['GET'])
@analytics_enabled
def api_analytics_categories():
    user_id = session['user_id']
    start_date, end_date = _parse_period_params()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
        ORDER BY total DESC
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({'categories': rows}), 200


@app.route('/api/analytics/trend', methods=['GET'])
@analytics_enabled
def api_analytics_trend():
    user_id = session['user_id']
    # period param: 'daily' or 'monthly' will determine aggregation
    agg = request.args.get('period', 'daily')
    start_date, end_date = _parse_period_params()

    conn = get_db()
    cursor = conn.cursor()

    if agg == 'monthly':
        # aggregate by month
        cursor.execute('''
            SELECT strftime('%Y-%m', date) as period, COALESCE(SUM(amount),0) as total
            FROM expenses
            WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
            GROUP BY period
            ORDER BY period ASC
        ''', (user_id, start_date.isoformat(), end_date.isoformat()))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return jsonify({'trend': rows}), 200
    else:
        # aggregate by day
        cursor.execute('''
            SELECT date as period, COALESCE(SUM(amount),0) as total
            FROM expenses
            WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
            GROUP BY date
            ORDER BY date ASC
        ''', (user_id, start_date.isoformat(), end_date.isoformat()))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return jsonify({'trend': rows}), 200


@app.route('/api/analytics/budget-vs-actual', methods=['GET'])
@analytics_enabled
def api_analytics_budget_vs_actual():
    user_id = session['user_id']
    start_date, end_date = _parse_period_params()

    conn = get_db()
    cursor = conn.cursor()

    # Get budgets for user
    cursor.execute('''
        SELECT category, monthly_limit
        FROM budgets
        WHERE user_id = ?
    ''', (user_id,))
    budgets = {r['category']: float(r['monthly_limit']) for r in cursor.fetchall()}

    # Get spent per category in period
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    spent_rows = {r['category']: float(r['total']) for r in cursor.fetchall()}

    # Combine
    categories = sorted(set(list(budgets.keys()) + list(spent_rows.keys())))
    result = []
    for c in categories:
        result.append({'category': c, 'budget': budgets.get(c, 0), 'spent': spent_rows.get(c, 0)})

    conn.close()
    return jsonify({'data': result}), 200


@app.route('/api/analytics/top-days', methods=['GET'])
@analytics_enabled
def api_analytics_top_days():
    user_id = session['user_id']
    limit = int(request.args.get('limit', 5))
    start_date, end_date = _parse_period_params()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT date, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY date
        ORDER BY total DESC
        LIMIT ?
    ''', (user_id, start_date.isoformat(), end_date.isoformat(), limit))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({'top_days': rows}), 200


@app.route('/api/analytics', methods=['GET'])
@analytics_enabled
def api_analytics():
    user_id = session['user_id']
    # Accept parameters: year, month (optional), quickFilter
    month = request.args.get('month')
    year = request.args.get('year')
    quick = request.args.get('quickFilter') or request.args.get('quick')

    # Let _parse_period_params handle both quick and quickFilter
    start_date, end_date = _parse_period_params()

    conn = get_db()
    cursor = conn.cursor()

    # Total spent
    cursor.execute('''
        SELECT COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    total_spent = float(cursor.fetchone()['total'] or 0)

    # Average per day
    days = (end_date - start_date).days + 1
    avg_per_day = total_spent / days if days > 0 else 0

    # Highest category
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    row = cursor.fetchone()
    highest_category = row['category'] if row else None

    # Percent change vs previous period (same length)
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days-1)
    cursor.execute('''
        SELECT COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
    ''', (user_id, prev_start.isoformat(), prev_end.isoformat()))
    prev_total = float(cursor.fetchone()['total'] or 0)
    percent_change = ((total_spent - prev_total) / prev_total * 100) if prev_total > 0 else 0

    # Category totals
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
        ORDER BY total DESC
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    category_rows = [dict(r) for r in cursor.fetchall()]
    category_totals = [{'category': r['category'], 'amount': float(r['total'])} for r in category_rows]

    # Spending trend - group by day for this_month, by month for longer periods
    quick = request.args.get('quickFilter') or request.args.get('quick')
    
    if quick in ('last_3_months', 'last-3-months', 'this_year', 'year'):
        # Group by month for longer periods
        cursor.execute('''
            SELECT 
                strftime('%Y-%m', date) as period,
                COALESCE(SUM(amount),0) as amount
            FROM expenses
            WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
            GROUP BY period
            ORDER BY period ASC
        ''', (user_id, start_date.isoformat(), end_date.isoformat()))
        trend_rows = [dict(r) for r in cursor.fetchall()]
        # Format labels as "Month Year" (e.g., "Dec 2025", "Jan 2026")
        spending_trend = []
        for r in trend_rows:
            period_str = r['period']  # Format: YYYY-MM
            year_part, month_part = period_str.split('-')
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            month_idx = int(month_part) - 1
            formatted_date = f"{month_names[month_idx]} {year_part}"
            spending_trend.append({'date': formatted_date, 'amount': float(r['amount']), 'period': period_str})
    else:
        # Group by day for shorter periods (this_month, week, today, etc.)
        cursor.execute('''
            SELECT date as date, COALESCE(SUM(amount),0) as amount
            FROM expenses
            WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
            GROUP BY date
            ORDER BY date ASC
        ''', (user_id, start_date.isoformat(), end_date.isoformat()))
        trend_rows = [dict(r) for r in cursor.fetchall()]
        spending_trend = [{'date': r['date'], 'amount': float(r['amount'])} for r in trend_rows]

    # Budget vs actual
    cursor.execute('''
        SELECT category, monthly_limit
        FROM budgets
        WHERE user_id = ?
    ''', (user_id,))
    budgets = {r['category']: float(r['monthly_limit']) for r in cursor.fetchall()}

    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    spent_rows = {r['category']: float(r['total']) for r in cursor.fetchall()}

    all_cats = sorted(set(list(budgets.keys()) + list(spent_rows.keys())))
    budget_vs_actual = [{'category': c, 'budget': budgets.get(c, 0), 'spent': spent_rows.get(c, 0)} for c in all_cats]

    # Top days
    cursor.execute('''
        SELECT date, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY date
        ORDER BY total DESC
        LIMIT 5
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    top_days_rows = [dict(r) for r in cursor.fetchall()]
    top_days = [{'date': r['date'], 'amount': float(r['total'])} for r in top_days_rows]

    # Generate smart insights
    insights = []
    if percent_change != 0:
        direction = "increased" if percent_change > 0 else "decreased"
        insights.append(f"Your spending {direction} by {abs(percent_change):.1f}% compared to last period")
    
    if highest_category:
        category_pct = (category_totals[0]['amount'] / total_spent * 100) if total_spent > 0 else 0
        insights.append(f"Top category: {highest_category} ({category_pct:.1f}% of total)")
    
    if top_days:
        top_day = top_days[0]
        insights.append(f"Highest spend: ₹{top_day['amount']:.0f} on {top_day['date']}")
    
    insights.append(f"Average per day: ₹{avg_per_day:.0f}")
    
    # Budget health
    total_budget = sum(budgets.values())
    budget_ratio = total_spent / total_budget if total_budget > 0 else 0
    
    if budget_ratio <= 0.8:
        health_status = "On Track"
        health_color = "green"
    elif budget_ratio <= 1.0:
        health_status = "Warning"
        health_color = "orange"
    else:
        health_status = "Over Budget"
        health_color = "red"
    
    budget_health = {
        'ratio': budget_ratio,
        'percentage': min(int(budget_ratio * 100), 100),
        'status': health_status,
        'color': health_color,
        'message': f"You used {budget_ratio * 100:.1f}% of your budget"
    }

    # Category ranking (top 10)
    category_ranking = []
    for i, cat in enumerate(category_totals[:10], 1):
        pct = (cat['amount'] / total_spent * 100) if total_spent > 0 else 0
        rank_badge = ''
        if i == 1:
            rank_badge = '🥇'
        elif i == 2:
            rank_badge = '🥈'
        elif i == 3:
            rank_badge = '🥉'
        
        category_ranking.append({
            'rank': i,
            'category': cat['category'],
            'amount': cat['amount'],
            'percentage': pct,
            'badge': rank_badge
        })

    conn.close()

    return jsonify({
        'totalSpent': total_spent,
        'avgPerDay': avg_per_day,
        'highestCategory': highest_category,
        'percentChange': percent_change,
        'categoryTotals': category_totals,
        'spendingTrend': spending_trend,
        'budgetVsActual': budget_vs_actual,
        'topDays': top_days,
        'insights': insights,
        'budgetHealth': budget_health,
        'categoryRanking': category_ranking
    }), 200

@app.route('/api/drilldown', methods=['GET'])
@login_required
def api_drilldown():
    """Get transactions for a specific category within date range"""
    user_id = session['user_id']
    category = request.args.get('category')
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    if not category or not start_date or not end_date:
        return jsonify({'error': 'Missing category, start, or end date'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Query transactions for the category within date range
    cursor.execute('''
        SELECT date, category, amount, notes
        FROM expenses
        WHERE user_id = ? AND category = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        ORDER BY date DESC
    ''', (user_id, category, start_date, end_date))
    
    transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({
        'category': category,
        'transactions': transactions,
        'count': len(transactions),
        'total': sum(t['amount'] for t in transactions)
    }), 200


@app.route('/api/analytics/spike-detector', methods=['GET'])
@analytics_enabled
def api_spike_detector():
    """Detect expense spikes (days where spending > 3x average)"""
    user_id = session['user_id']
    start_date, end_date = _parse_period_params()

    conn = get_db()
    cursor = conn.cursor()

    # Get daily spending
    cursor.execute('''
        SELECT date, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY date
        ORDER BY date ASC
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    
    daily_totals = [{'date': r['date'], 'amount': float(r['total'])} for r in cursor.fetchall()]
    
    # Calculate average daily spending
    amounts = [d['amount'] for d in daily_totals]
    avg_spending = sum(amounts) / len(amounts) if amounts else 0
    
    # Find spikes (days > 3x average)
    spikes = []
    for d in daily_totals:
        if d['amount'] > 3 * avg_spending and avg_spending > 0:
            pct_above = ((d['amount'] - avg_spending) / avg_spending) * 100
            multiple = d['amount'] / avg_spending
            spikes.append({
                'date': d['date'],
                'amount': d['amount'],
                'multiple': round(multiple, 1),
                'pct_above': round(pct_above, 1)
            })
    
    # Sort by amount descending
    spikes.sort(key=lambda x: x['amount'], reverse=True)
    
    conn.close()
    return jsonify({
        'spikes': spikes,
        'average_daily': avg_spending,
        'spike_threshold': 3 * avg_spending
    }), 200


@app.route('/api/analytics/forecast', methods=['GET'])
@analytics_enabled
def api_forecast():
    """Project spending for the rest of the month"""
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    today = datetime.now().date()
    month_start = today.replace(day=1)
    month_end = (month_start + relativedelta(months=1)) - timedelta(days=1)
    
    # Get spending so far this month
    cursor.execute('''
        SELECT COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
    ''', (user_id, month_start.isoformat(), today.isoformat()))
    spent_so_far = float(cursor.fetchone()['total'] or 0)
    
    # Get budget
    cursor.execute('''
        SELECT COALESCE(SUM(monthly_limit),0) as total
        FROM budgets
        WHERE user_id = ?
    ''', (user_id,))
    total_budget = float(cursor.fetchone()['total'] or 0)
    
    # Calculate projection
    days_elapsed = (today - month_start).days + 1
    days_in_month = (month_end - month_start).days + 1
    days_remaining = days_in_month - days_elapsed
    
    if days_elapsed > 0:
        daily_avg = spent_so_far / days_elapsed
        projected_total = daily_avg * days_in_month
    else:
        projected_total = 0
    
    # Status
    status = 'on-track'
    if total_budget > 0:
        if projected_total > total_budget * 1.2:
            status = 'danger'
        elif projected_total > total_budget:
            status = 'warning'
    
    conn.close()
    return jsonify({
        'spent_so_far': spent_so_far,
        'projected_total': projected_total,
        'budget': total_budget,
        'days_elapsed': days_elapsed,
        'days_remaining': days_remaining,
        'status': status
    }), 200


@app.route('/api/analytics/comparison', methods=['GET'])
@analytics_enabled
def api_comparison():
    """Compare spending between current and previous periods"""
    user_id = session['user_id']
    
    # Get date range from parameters or use defaults
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if start_date_str and end_date_str:
        try:
            current_start = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            current_end = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    else:
        # Default to this month
        today = datetime.now().date()
        current_start = today.replace(day=1)
        current_end = today
    
    # Calculate previous period: same length period before current period
    period_length = (current_end - current_start).days + 1
    previous_end = current_start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=period_length - 1)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get current period spending by category
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
    ''', (user_id, current_start.isoformat(), current_end.isoformat()))
    current_cats = {r['category']: float(r['total']) for r in cursor.fetchall()}
    
    # Get previous period spending by category
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
    ''', (user_id, previous_start.isoformat(), previous_end.isoformat()))
    prev_cats = {r['category']: float(r['total']) for r in cursor.fetchall()}
    
    # Calculate totals
    current_total = sum(current_cats.values())
    previous_total = sum(prev_cats.values())
    
    # Calculate total change percentage
    if previous_total > 0:
        total_change_pct = ((current_total - previous_total) / previous_total) * 100
    else:
        total_change_pct = 100 if current_total > 0 else 0
    
    # Calculate category changes
    all_cats = set(list(current_cats.keys()) + list(prev_cats.keys()))
    category_changes = []
    for cat in sorted(all_cats):
        curr = current_cats.get(cat, 0)
        prev = prev_cats.get(cat, 0)
        change = curr - prev
        
        if prev > 0:
            change_pct = (change / prev) * 100
        else:
            change_pct = 100 if curr > 0 else 0
        
        category_changes.append({
            'category': cat,
            'current': curr,
            'previous': prev,
            'change': change,
            'change_pct': round(change_pct, 1)
        })
    
    # Find top increase and decrease
    top_increase = None
    top_decrease = None
    
    for cat_data in category_changes:
        if cat_data['change'] > 0:
            if top_increase is None or cat_data['change'] > top_increase['amount']:
                top_increase = {
                    'category': cat_data['category'],
                    'amount': cat_data['change'],
                    'change_pct': cat_data['change_pct']
                }
        elif cat_data['change'] < 0:
            if top_decrease is None or cat_data['change'] < top_decrease['amount']:
                top_decrease = {
                    'category': cat_data['category'],
                    'amount': cat_data['change'],
                    'change_pct': cat_data['change_pct']
                }
    
    conn.close()
    
    return jsonify({
        'current_total': round(current_total, 2),
        'previous_total': round(previous_total, 2),
        'total_change_pct': round(total_change_pct, 1),
        'top_increase': top_increase,
        'top_decrease': top_decrease,
        'categories': category_changes,
        'period_info': {
            'current_start': current_start.isoformat(),
            'current_end': current_end.isoformat(),
            'previous_start': previous_start.isoformat(),
            'previous_end': previous_end.isoformat(),
            'period_length': period_length
        }
    }), 200


@app.route('/api/analytics/export/excel', methods=['GET'])
@analytics_enabled
def api_export_excel():
    """Export analytics data to Excel"""
    if not EXCEL_AVAILABLE:
        return jsonify({'error': 'Excel export not available. Install openpyxl: pip install openpyxl'}), 400
    
    user_id = session['user_id']
    start_date, end_date = _parse_period_params()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get all transactions
    cursor.execute('''
        SELECT date, category, amount, notes
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        ORDER BY date DESC
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    transactions = [dict(r) for r in cursor.fetchall()]
    
    # Get category totals
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
        ORDER BY total DESC
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    categories = [dict(r) for r in cursor.fetchall()]
    
    # Get daily totals
    cursor.execute('''
        SELECT date, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY date
        ORDER BY date ASC
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    daily = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    # Create workbook
    wb = Workbook()
    wb.remove(wb.active)
    
    # Transactions sheet
    ws_trans = wb.create_sheet('Transactions')
    ws_trans.append(['Date', 'Category', 'Amount', 'Notes'])
    for tx in transactions:
        ws_trans.append([tx['date'], tx['category'], float(tx['amount']), tx['notes'] or ''])
    
    # Category totals sheet
    ws_cat = wb.create_sheet('Category Totals')
    ws_cat.append(['Category', 'Total Amount'])
    for cat in categories:
        ws_cat.append([cat['category'], float(cat['total'])])
    
    # Daily totals sheet
    ws_daily = wb.create_sheet('Daily Totals')
    ws_daily.append(['Date', 'Total Amount'])
    for day in daily:
        ws_daily.append([day['date'], float(day['total'])])
    
    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return Response(
        output.getvalue(),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment;filename=analytics.xlsx'}
    )


@app.route('/api/analytics/export/pdf', methods=['GET'])
@analytics_enabled
def api_export_pdf():
    """Export analytics summary to PDF"""
    if not PDF_AVAILABLE:
        return jsonify({'error': 'PDF export not available. Install reportlab: pip install reportlab'}), 400
    
    user_id = session['user_id']
    start_date, end_date = _parse_period_params()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get metrics
    cursor.execute('''
        SELECT COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    total_spent = float(cursor.fetchone()['total'] or 0)
    
    days = (end_date - start_date).days + 1
    avg_per_day = total_spent / days if days > 0 else 0
    
    # Get category totals
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount),0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        GROUP BY category
        ORDER BY total DESC
        LIMIT 10
    ''', (user_id, start_date.isoformat(), end_date.isoformat()))
    categories = [dict(r) for r in cursor.fetchall()]
    
    # Get budget
    cursor.execute('''
        SELECT COALESCE(SUM(monthly_limit),0) as total
        FROM budgets
        WHERE user_id = ?
    ''', (user_id,))
    total_budget = float(cursor.fetchone()['total'] or 0)
    
    conn.close()
    
    # Create PDF
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=30,
        alignment=1
    )
    story.append(Paragraph('Spending Analytics Report', title_style))
    story.append(Spacer(1, 12))
    
    # Period
    period_text = f"Period: {start_date} to {end_date}"
    story.append(Paragraph(period_text, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Overview metrics
    story.append(Paragraph('Overview Metrics', styles['Heading2']))
    metrics_data = [
        ['Metric', 'Value'],
        ['Total Spent', f'₹{total_spent:.2f}'],
        ['Average per Day', f'₹{avg_per_day:.2f}'],
        ['Total Budget', f'₹{total_budget:.2f}'],
        ['Budget Usage', f'{(total_spent/total_budget*100):.1f}%' if total_budget > 0 else 'N/A']
    ]
    
    metrics_table = Table(metrics_data)
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 20))
    
    # Category breakdown
    story.append(Paragraph('Top Categories', styles['Heading2']))
    cat_data = [['Category', 'Amount', '% of Total']]
    for cat in categories:
        pct = (float(cat['total']) / total_spent * 100) if total_spent > 0 else 0
        cat_data.append([cat['category'], f"₹{float(cat['total']):.2f}", f'{pct:.1f}%'])
    
    cat_table = Table(cat_data)
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(cat_table)
    
    # Build PDF
    doc.build(story)
    output.seek(0)
    
    return Response(
        output.getvalue(),
        mimetype='application/pdf',
        headers={'Content-Disposition': 'attachment;filename=analytics.pdf'}
    )

@app.route('/api/register', methods=['POST'])
def register():
    print('[Register] Received registration request')
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    print(f'[Register] Username: {username}')
    
    if not username or not password:
        print('[Register] Missing username or password')
        return jsonify({'error': 'Username and password required'}), 400
    
    if len(password) < 6:
        print('[Register] Password too short')
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        print('[Register] Hashing password')
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        print('[Register] Inserting user into database')
        cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', 
                      (username, hashed_password))
        conn.commit()
        user_id = cursor.lastrowid
        print(f'[Register] User registered with ID: {user_id}')
        
        # Set session with permanent flag
        session.permanent = True
        session['user_id'] = user_id
        session['username'] = username
        print(f'[Register] Session created with user_id: {user_id}')
        print(f'[Register] Session permanent: {session.permanent}')
        
        return jsonify({
            'message': 'Registration successful',
            'user_id': user_id,
            'username': username
        }), 201
    except sqlite3.IntegrityError as e:
        print(f'[Register] User already exists: {e}')
        conn.close()
        return jsonify({'error': 'Username already exists'}), 400
    except Exception as e:
        print(f'[Register] Registration error: {e}')
        conn.close()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    print('[Login] Received login request')
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    print(f'[Login] Username: {username}')
    
    if not username or not password:
        print('[Login] Missing username or password')
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, password, username FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    
    if user is None:
        conn.close()
        print(f'[Login] User {username} not found in database')
        return jsonify({'error': 'Invalid credentials'}), 401
    
    print(f'[Login] User found, verifying password')
    
    db_password = user['password']
    password_valid = False
    
    try:
        # Primary path: bcrypt hash verification
        password_valid = bcrypt.check_password_hash(db_password, password)
    except Exception as e:
        # If stored password is not a valid bcrypt hash (legacy plaintext), fall back
        print(f'[Login] bcrypt verification error for user {username}: {e}')
        if db_password == password:
            print(f'[Login] Legacy plaintext password matched for user {username}, migrating to bcrypt hash')
            try:
                new_hashed = bcrypt.generate_password_hash(password).decode('utf-8')
                cursor.execute('UPDATE users SET password = ? WHERE id = ?', (new_hashed, user['id']))
                conn.commit()
                password_valid = True
            except Exception as update_error:
                print(f'[Login] Failed to migrate legacy password for user {username}: {update_error}')
                conn.rollback()
                password_valid = False
    
    if not password_valid:
        conn.close()
        print(f'[Login] Password verification failed for user {username}')
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Successful login
    print(f'[Login] Password verified for user {username}')
    
    # Set session with permanent flag
    session.permanent = True
    session['user_id'] = user['id']
    session['username'] = username
    
    conn.close()
    
    print(f'[Login] Session created with user_id: {user["id"]}')
    print(f'[Login] Session data: {dict(session)}')
    print(f'[Login] Session permanent: {session.permanent}')
    
    return jsonify({
        'message': 'Login successful',
        'user_id': user['id'],
        'username': username
    }), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    print('[Logout] User logging out')
    print(f'[Logout] Session before clear: {dict(session)}')
    session.clear()
    print('[Logout] Session cleared')
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/forgot-password')
def forgot_password():
    """Forgot Password page - placeholder for password recovery"""
    return render_template('forgot_password.html', cache_buster=datetime.now().timestamp())

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    print(f'[CheckAuth] Checking authentication')
    print(f'[CheckAuth] Session: {dict(session)}')
    print(f'[CheckAuth] User ID in session: {"user_id" in session}')
    
    if 'user_id' in session:
        print(f'[CheckAuth] User authenticated - user_id: {session["user_id"]}, username: {session.get("username")}')
        return jsonify({
            'authenticated': True,
            'user_id': session['user_id'],
            'username': session.get('username'),
            'preferred_name': session.get('preferred_name')
        }), 200
    else:
        print('[CheckAuth] User not authenticated')
        return jsonify({'authenticated': False}), 200


# Settings API Routes
@app.route('/api/settings/profile', methods=['GET'])
@login_required
def get_settings_profile():
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT username, email, preferred_name FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'username': user['username'],
            'email': user['email'] or '',
            'preferred_name': user['preferred_name'] or ''
        }), 200
    return jsonify({'error': 'User not found'}), 404


@app.route('/api/settings/profile', methods=['POST'])
@login_required
def update_settings_profile():
    user_id = session['user_id']
    data = request.get_json()
    
    username = data.get('username', '').strip()
    preferred_name = data.get('preferred_name', '').strip()
    
    if not username:
        return jsonify({'error': 'Username cannot be empty'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('UPDATE users SET preferred_name = ? WHERE id = ?', (preferred_name, user_id))
        conn.commit()
        
        # Update session
        session['username'] = username
        
        return jsonify({
            'message': 'Profile updated successfully',
            'username': username,
            'preferred_name': preferred_name
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/settings/localization', methods=['GET'])
@login_required
def get_settings_localization():
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT currency, date_format, number_format FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'currency': user['currency'] or 'INR',
            'date_format': user['date_format'] or 'DD/MM/YYYY',
            'number_format': user['number_format'] or 'en-IN'
        }), 200
    return jsonify({'error': 'User not found'}), 404


@app.route('/api/settings/localization', methods=['POST'])
@login_required
def update_settings_localization():
    user_id = session['user_id']
    data = request.get_json()
    
    currency = data.get('currency', 'INR')
    date_format = data.get('date_format', 'DD/MM/YYYY')
    number_format = data.get('number_format', 'en-IN')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''UPDATE users SET currency = ?, date_format = ?, number_format = ? 
                          WHERE id = ?''', (currency, date_format, number_format, user_id))
        conn.commit()
        
        return jsonify({
            'message': 'Localization settings updated',
            'currency': currency,
            'date_format': date_format,
            'number_format': number_format
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/settings/notifications', methods=['GET'])
@login_required
def get_settings_notifications():
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''SELECT budget_alert, spike_alert, weekly_summary, monthly_report 
                      FROM users WHERE id = ?''', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'budget_alert': bool(user['budget_alert']),
            'spike_alert': bool(user['spike_alert']),
            'weekly_summary': bool(user['weekly_summary']),
            'monthly_report': bool(user['monthly_report'])
        }), 200
    return jsonify({'error': 'User not found'}), 404


@app.route('/api/settings/notifications', methods=['POST'])
@login_required
def update_settings_notifications():
    user_id = session['user_id']
    data = request.get_json()
    
    budget_alert = 1 if data.get('budget_alert', False) else 0
    spike_alert = 1 if data.get('spike_alert', False) else 0
    weekly_summary = 1 if data.get('weekly_summary', False) else 0
    monthly_report = 1 if data.get('monthly_report', False) else 0
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''UPDATE users SET budget_alert = ?, spike_alert = ?, 
                          weekly_summary = ?, monthly_report = ? WHERE id = ?''',
                       (budget_alert, spike_alert, weekly_summary, monthly_report, user_id))
        conn.commit()
        
        return jsonify({
            'message': 'Notification preferences updated',
            'budget_alert': bool(budget_alert),
            'spike_alert': bool(spike_alert),
            'weekly_summary': bool(weekly_summary),
            'monthly_report': bool(monthly_report)
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/settings/change-password', methods=['POST'])
@login_required
def change_password():
    user_id = session['user_id']
    data = request.get_json()
    
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current and new passwords are required'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT password FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user or not bcrypt.check_password_hash(user['password'], current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        cursor.execute('UPDATE users SET password = ? WHERE id = ?', (hashed_password, user_id))
        conn.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/settings/update-email', methods=['POST'])
@login_required
def update_email():
    user_id = session['user_id']
    data = request.get_json()
    
    new_email = data.get('new_email', '').strip()
    password = data.get('password', '')
    
    if not new_email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Validate email format
    import re
    email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_pattern, new_email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get user's current password hash
        cursor.execute('SELECT password, email FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify password
        if not bcrypt.check_password_hash(user['password'], password):
            return jsonify({'error': 'Password is incorrect'}), 401
        
        # Check if email is already in use by another user
        cursor.execute('SELECT id FROM users WHERE email = ? AND id != ?', (new_email, user_id))
        existing_user = cursor.fetchone()
        
        if existing_user:
            return jsonify({'error': 'Email is already in use'}), 409
        
        # Update email
        cursor.execute('UPDATE users SET email = ? WHERE id = ?', (new_email, user_id))
        conn.commit()
        
        return jsonify({
            'message': 'Email updated successfully',
            'email': new_email
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/settings/logout-all', methods=['POST'])
@login_required
def logout_all():
    # Clear current session
    session.clear()
    # In a real app, you might invalidate all sessions for this user in the database
    return jsonify({'message': 'Logged out from all devices'}), 200


# ===== CATEGORIES MANAGEMENT =====

@app.route('/api/settings/categories', methods=['GET'])
@login_required
def get_categories():
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    
    # Get custom categories
    cursor.execute('SELECT id, name, color FROM categories WHERE user_id = ? ORDER BY name', (user_id,))
    custom_cats = [{'id': r['id'], 'name': r['name'], 'color': r['color']} for r in cursor.fetchall()]
    
    # Get predefined categories
    predefined = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education']
    
    conn.close()
    return jsonify({
        'custom': custom_cats,
        'predefined': predefined
    }), 200


@app.route('/api/settings/categories', methods=['POST'])
@login_required
def create_category():
    user_id = session['user_id']
    data = request.get_json()
    
    name = data.get('name', '').strip()
    color = data.get('color', '#14b8a6')
    
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    
    if len(name) > 50:
        return jsonify({'error': 'Category name must be less than 50 characters'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)', 
                      (user_id, name, color))
        conn.commit()
        
        category_id = cursor.lastrowid
        return jsonify({
            'id': category_id,
            'name': name,
            'color': color,
            'message': 'Category added successfully'
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Category already exists'}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/settings/categories/<int:cat_id>', methods=['PUT'])
@login_required
def update_category(cat_id):
    user_id = session['user_id']
    data = request.get_json()
    
    name = data.get('name', '').strip()
    color = data.get('color', '#14b8a6')
    
    if not name:
        return jsonify({'error': 'Category name is required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Verify category belongs to user
        cursor.execute('SELECT id FROM categories WHERE id = ? AND user_id = ?', (cat_id, user_id))
        if not cursor.fetchone():
            return jsonify({'error': 'Category not found'}), 404
        
        cursor.execute('UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?',
                      (name, color, cat_id, user_id))
        conn.commit()
        
        return jsonify({
            'id': cat_id,
            'name': name,
            'color': color,
            'message': 'Category updated successfully'
        }), 200
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Category name already exists'}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/settings/categories/<int:cat_id>', methods=['DELETE'])
@login_required
def delete_category(cat_id):
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Verify category belongs to user
        cursor.execute('SELECT id FROM categories WHERE id = ? AND user_id = ?', (cat_id, user_id))
        if not cursor.fetchone():
            return jsonify({'error': 'Category not found'}), 404
        
        # Check if category is used in expenses
        cursor.execute('SELECT COUNT(*) as count FROM expenses WHERE user_id = ? AND category = (SELECT name FROM categories WHERE id = ?)',
                      (user_id, cat_id))
        count = cursor.fetchone()['count']
        
        if count > 0:
            return jsonify({'error': f'Cannot delete category with {count} associated expenses'}), 409
        
        cursor.execute('DELETE FROM categories WHERE id = ? AND user_id = ?', (cat_id, user_id))
        conn.commit()
        
        return jsonify({'message': 'Category deleted successfully'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ===== PRIVACY & SECURITY SETTINGS =====

@app.route('/api/settings/security', methods=['GET'])
@login_required
def get_security_settings():
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT require_login, auto_logout, hide_amounts, lock_analytics FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'require_login': bool(user['require_login']),
            'auto_logout': bool(user['auto_logout']),
            'hide_amounts': bool(user['hide_amounts']),
            'lock_analytics': bool(user['lock_analytics'])
        }), 200
    return jsonify({'error': 'User not found'}), 404


@app.route('/api/settings/security', methods=['POST'])
@login_required
def update_security_settings():
    user_id = session['user_id']
    data = request.get_json()
    
    require_login = 1 if data.get('require_login', False) else 0
    auto_logout = 1 if data.get('auto_logout', False) else 0
    hide_amounts = 1 if data.get('hide_amounts', False) else 0
    lock_analytics = 1 if data.get('lock_analytics', False) else 0
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''UPDATE users SET require_login = ?, auto_logout = ?, hide_amounts = ?, lock_analytics = ? 
                         WHERE id = ?''',
                      (require_login, auto_logout, hide_amounts, lock_analytics, user_id))
        conn.commit()
        
        return jsonify({
            'message': 'Security settings updated',
            'require_login': bool(require_login),
            'auto_logout': bool(auto_logout),
            'hide_amounts': bool(hide_amounts),
            'lock_analytics': bool(lock_analytics)
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ===== EXPORT & BACKUP =====

@app.route('/api/export/excel', methods=['GET'])
@login_required
def export_excel():
    if not EXCEL_AVAILABLE:
        return jsonify({'error': 'Excel export not available'}), 503
    
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    
    # Get all expenses for user
    cursor.execute('''SELECT amount, category, date, notes FROM expenses 
                     WHERE user_id = ? AND deleted_at IS NULL 
                     ORDER BY date DESC''', (user_id,))
    expenses = cursor.fetchall()
    
    # Get user info for filename
    cursor.execute('SELECT username FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    try:
        wb = Workbook()
        ws = wb.active
        ws.title = 'Expenses'
        
        # Add headers
        headers = ['Date', 'Category', 'Amount', 'Notes']
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col)
            cell.value = header
            cell.font = Font(bold=True, color='FFFFFF')
            cell.fill = PatternFill(start_color='14b8a6', end_color='14b8a6', fill_type='solid')
        
        # Add data
        for row_idx, exp in enumerate(expenses, 2):
            ws.cell(row=row_idx, column=1).value = exp['date']
            ws.cell(row=row_idx, column=2).value = exp['category']
            ws.cell(row=row_idx, column=3).value = float(exp['amount'])
            ws.cell(row=row_idx, column=4).value = exp['notes'] or ''
        
        # Adjust column widths
        ws.column_dimensions['A'].width = 12
        ws.column_dimensions['B'].width = 15
        ws.column_dimensions['C'].width = 12
        ws.column_dimensions['D'].width = 20
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        return Response(
            output.getvalue(),
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment;filename=expenses_{user["username"]}.xlsx'}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/export/pdf', methods=['GET'])
@login_required
def export_pdf():
    if not PDF_AVAILABLE:
        return jsonify({'error': 'PDF export not available'}), 503
    
    user_id = session['user_id']
    
    # Get month and year from query parameters (optional)
    month_param = request.args.get('month')
    year_param = request.args.get('year')
    
    if month_param and year_param:
        # Use provided month and year
        try:
            export_month = str(month_param).zfill(2)
            export_year = int(year_param)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid month or year parameter'}), 400
    else:
        # Use current month and year
        today = datetime.now()
        export_month = str(today.month).zfill(2)
        export_year = today.year
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get user info
    cursor.execute('SELECT username, preferred_name, currency FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    # Get expenses for selected month and year
    cursor.execute('''SELECT amount, category, date, notes FROM expenses 
                     WHERE user_id = ? AND deleted_at IS NULL 
                     AND strftime('%Y-%m', date) = ?
                     ORDER BY date DESC''', (user_id, f'{export_year}-{export_month}'))
    expenses = cursor.fetchall()
    
    # Get summary for selected month and year
    cursor.execute('''SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
                     WHERE user_id = ? AND deleted_at IS NULL 
                     AND strftime('%Y-%m', date) = ?''', (user_id, f'{export_year}-{export_month}'))
    total = cursor.fetchone()['total']
    
    conn.close()
    
    try:
        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=letter)
        story = []
        
        # Add title
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#14b8a6'),
            spaceAfter=30
        )
        
        # Convert month number to month name
        month_date = datetime(export_year, int(export_month), 1)
        month_name = month_date.strftime('%B')
        
        story.append(Paragraph(f'SpendSense Financial Report', title_style))
        story.append(Paragraph(f'User: {user["preferred_name"] or user["username"]}', styles['Normal']))
        story.append(Paragraph(f'Period: {month_name} {export_year}', styles['Normal']))
        story.append(Paragraph(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}', styles['Normal']))
        story.append(Spacer(1, 0.5*inch))
        
        # Add table
        data = [['Date', 'Category', 'Amount', 'Notes']]
        for exp in expenses:
            data.append([
                exp['date'],
                exp['category'],
                f"{user['currency']} {float(exp['amount']):.2f}",
                exp['notes'] or '-'
            ])
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#14b8a6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(table)
        story.append(Spacer(1, 0.3*inch))
        
        # Add total
        total_text = f'Total Spent: {user["currency"]} {total:.2f}'
        story.append(Paragraph(f'<b>{total_text}</b>', styles['Normal']))
        
        doc.build(story)
        output.seek(0)
        
        # Create filename with selected month and year
        filename = f'SpendSense_Report_{month_name}_{export_year}.pdf'
        
        return Response(
            output.getvalue(),
            mimetype='application/pdf',
            headers={'Content-Disposition': f'attachment;filename={filename}'}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/backup', methods=['POST'])
@login_required
def backup_data():
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get user info
        cursor.execute('SELECT username FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        # Get all expenses
        cursor.execute('SELECT * FROM expenses WHERE user_id = ?', (user_id,))
        expenses = [dict(r) for r in cursor.fetchall()]
        
        # Get budgets
        cursor.execute('SELECT * FROM budgets WHERE user_id = ?', (user_id,))
        budgets = [dict(r) for r in cursor.fetchall()]
        
        # Get categories
        cursor.execute('SELECT * FROM categories WHERE user_id = ?', (user_id,))
        categories = [dict(r) for r in cursor.fetchall()]
        
        backup_data_obj = {
            'backup_date': datetime.now().isoformat(),
            'expenses': expenses,
            'budgets': budgets,
            'categories': categories
        }
        
        import json
        backup_json = json.dumps(backup_data_obj, indent=2)
        
        return Response(
            backup_json,
            mimetype='application/json',
            headers={'Content-Disposition': f'attachment;filename=backup_{user["username"]}.json'}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/restore', methods=['POST'])
@login_required
def restore_data():
    user_id = session['user_id']
    
    try:
        import json
        backup_data_obj = request.get_json()
        
        if not backup_data_obj:
            return jsonify({'error': 'No backup data provided'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Restore expenses
        expenses = backup_data_obj.get('expenses', [])
        for exp in expenses:
            cursor.execute('''INSERT INTO expenses (user_id, amount, category, date, notes, currency) 
                             VALUES (?, ?, ?, ?, ?, ?)''',
                          (user_id, exp['amount'], exp['category'], exp['date'], 
                           exp.get('notes'), exp.get('currency', 'INR')))
        
        # Restore categories
        categories = backup_data_obj.get('categories', [])
        for cat in categories:
            cursor.execute('''INSERT OR IGNORE INTO categories (user_id, name, color) 
                             VALUES (?, ?, ?)''',
                          (user_id, cat['name'], cat.get('color', '#14b8a6')))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Data restored successfully',
            'expenses_restored': len(expenses),
            'categories_restored': len(categories)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/expenses', methods=['GET'])
@login_required
def get_expenses():
    user_id = session['user_id']
    month = request.args.get('month')
    year = request.args.get('year')
    
    conn = get_db()
    cursor = conn.cursor()
    
    if month and year:
        cursor.execute('''
            SELECT * FROM expenses 
            WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
            ORDER BY date DESC
        ''', (user_id, year, month.zfill(2)))
    elif year:
        cursor.execute('''
            SELECT * FROM expenses 
            WHERE user_id = ? AND strftime('%Y', date) = ? AND deleted_at IS NULL
            ORDER BY date DESC
        ''', (user_id, year))
    else:
        cursor.execute('''
            SELECT * FROM expenses 
            WHERE user_id = ? AND deleted_at IS NULL
            ORDER BY date DESC
        ''', (user_id,))
    
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(expenses), 200

@app.route('/api/expenses', methods=['POST'])
@login_required
def add_expense():
    data = request.json
    user_id = session['user_id']
    
    amount = data.get('amount')
    category = data.get('category')
    currency = data.get('currency', 'INR')
    date = data.get('date')
    notes = data.get('notes', '')
    recurring_frequency = data.get('recurring_frequency')  # 'weekly', 'monthly', or None
    
    if not amount or not category or not date:
        return jsonify({'error': 'Amount, category, and date are required'}), 400
    
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400

    if not category:
        return jsonify({'error': 'Category is required'}), 400
    if category == 'Other':
        return jsonify({'error': 'Please provide a custom category instead of Other'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO expenses (user_id, amount, category, date, notes, currency, recurring_frequency)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, amount, category, date, notes, currency, recurring_frequency))
    conn.commit()
    expense_id = cursor.lastrowid
    conn.close()
    
    return jsonify({'message': 'Expense added successfully', 'id': expense_id}), 201

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@login_required
def update_expense(expense_id):
    data = request.json
    user_id = session['user_id']
    
    amount = data.get('amount')
    category = data.get('category')
    currency = data.get('currency', 'INR')
    date = data.get('date')
    notes = data.get('notes', '')
    recurring_frequency = data.get('recurring_frequency')  # 'weekly', 'monthly', or None
    
    if not amount or not category or not date:
        return jsonify({'error': 'Amount, category, and date are required'}), 400
    
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400

    if not category:
        return jsonify({'error': 'Category is required'}), 400
    if category == 'Other':
        return jsonify({'error': 'Please provide a custom category instead of Other'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE expenses 
        SET amount = ?, category = ?, date = ?, notes = ?, currency = ?, recurring_frequency = ?
        WHERE id = ? AND user_id = ?
    ''', (amount, category, date, notes, currency, recurring_frequency, expense_id, user_id))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Expense not found'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Expense updated successfully'}), 200

@app.route('/api/expenses/generate-recurring', methods=['POST'])
@login_required
def generate_recurring_expenses():
    """Generate new expenses from recurring patterns for all users"""
    conn = get_db()
    cursor = conn.cursor()
    
    today = datetime.now().date()
    
    # Get all recurring expenses
    cursor.execute('''
        SELECT id, user_id, amount, category, notes, currency, recurring_frequency, date
        FROM expenses
        WHERE recurring_frequency IS NOT NULL AND deleted_at IS NULL
        ORDER BY date DESC
    ''')
    
    recurring_expenses = cursor.fetchall()
    generated_count = 0
    
    for expense in recurring_expenses:
        exp_date = datetime.strptime(expense['date'], '%Y-%m-%d').date()
        freq = expense['recurring_frequency']
        
        # Calculate next occurrence date
        next_date = None
        if freq == 'weekly':
            next_date = exp_date + timedelta(days=7)
        elif freq == 'monthly':
            next_date = exp_date + relativedelta(months=1)
        
        # Generate recurring expense if next occurrence is today or earlier
        if next_date and next_date <= today:
            cursor.execute('''
                INSERT INTO expenses (user_id, amount, category, date, notes, currency, recurring_frequency)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                expense['user_id'],
                expense['amount'],
                expense['category'],
                next_date.isoformat(),
                expense['notes'],
                expense['currency'],
                freq
            ))
            generated_count += 1
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': f'Generated {generated_count} recurring expenses', 'count': generated_count}), 200

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    # Soft delete - set deleted_at timestamp
    cursor.execute('''
        UPDATE expenses SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    ''', (expense_id, user_id))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Expense not found or already deleted'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Expense deleted successfully', 'deleted': True}), 200

@app.route('/api/expenses/<int:expense_id>/undo-delete', methods=['POST'])
@login_required
def undo_delete_expense(expense_id):
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE expenses SET deleted_at = NULL
        WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL
    ''', (expense_id, user_id))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Expense not found or not deleted'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Expense restored successfully'}), 200

@app.route('/api/budgets', methods=['GET'])
@login_required
def get_budgets():
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT category, monthly_limit, currency
        FROM budgets
        WHERE user_id = ?
    ''', (user_id,))
    
    budgets = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(budgets), 200

@app.route('/api/budgets', methods=['POST'])
@login_required
def set_budget():
    data = request.json
    user_id = session['user_id']
    
    category = data.get('category')
    monthly_limit = data.get('monthly_limit')
    currency = data.get('currency', 'INR')
    
    if not category or monthly_limit is None:
        return jsonify({'error': 'Category and monthly_limit are required'}), 400
    
    try:
        monthly_limit = float(monthly_limit)
        if monthly_limit <= 0:
            return jsonify({'error': 'Monthly limit must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid monthly limit'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO budgets (user_id, category, monthly_limit, currency, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ''', (user_id, category, monthly_limit, currency))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Budget set successfully'}), 201

@app.route('/api/expenses/export', methods=['GET'])
@login_required
def export_expenses():
    user_id = session['user_id']
    month = request.args.get('month')
    year = request.args.get('year')
    category_filter = request.args.get('category')
    time_period = request.args.get('period', 'monthly')  # weekly or monthly
    
    if not year:
        return jsonify({'error': 'Year is required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Build query based on filters
    query = '''
        SELECT date, category, amount, notes, currency
        FROM expenses
        WHERE user_id = ? AND deleted_at IS NULL
    '''
    params = [user_id]
    
    if time_period == 'monthly' and month:
        query += " AND strftime('%Y', date) = ? AND strftime('%m', date) = ?"
        params.extend([year, month.zfill(2)])
    elif time_period == 'weekly':
        # For weekly, we need to calculate the week range
        # This is simplified - in a real app you'd calculate proper week boundaries
        query += " AND strftime('%Y', date) = ?"
        params.append(year)
        if month:
            query += " AND strftime('%m', date) = ?"
            params.append(month.zfill(2))
    else:
        query += " AND strftime('%Y', date) = ?"
        params.append(year)
    
    if category_filter:
        query += " AND category = ?"
        params.append(category_filter)
    
    query += " ORDER BY date DESC"
    
    cursor.execute(query, params)
    expenses = cursor.fetchall()
    conn.close()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Date', 'Category', 'Amount', 'Currency', 'Notes'])
    
    # Write data
    for expense in expenses:
        notes = expense['notes'] if expense['notes'] else ''
        # Force date as plain text with single quote prefix to prevent Excel interpretation
        # as numeric date value which causes ######## display
        date_value = f"'{expense['date']}" if expense['date'] else ''
        writer.writerow([
            date_value,
            expense['category'],
            f"{expense['amount']:.2f}",
            expense['currency'],
            notes
        ])
    
    # Prepare response
    output.seek(0)
    filename = f"spendsense_expenses_{year}_{month or 'all'}.csv"
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )

@app.route('/api/budgets/<category>', methods=['DELETE'])
@login_required
def delete_budget(category):
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM budgets WHERE user_id = ? AND category = ?
    ''', (user_id, category))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Budget not found'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Budget deleted successfully'}), 200

@app.route('/api/summary', methods=['GET'])
@login_required
def get_summary():
    user_id = session['user_id']
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not month or not year:
        return jsonify({'error': 'Month and year are required'}), 400
    
    print(f"get_summary: user_id={user_id}, year={year}, month={month}")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Totals grouped by currency
    cursor.execute('''
        SELECT currency, COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
        GROUP BY currency
    ''', (user_id, year, month.zfill(2)))
    totals_by_currency = [dict(row) for row in cursor.fetchall()]
    print(f"Totals: {totals_by_currency}")
    
    # Category-wise breakdown grouped by currency
    cursor.execute('''
        SELECT currency, category, COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
        GROUP BY currency, category
        ORDER BY currency, total DESC
    ''', (user_id, year, month.zfill(2)))
    rows = [dict(row) for row in cursor.fetchall()]
    print(f"Categories rows: {len(rows)}")
    
    # Get budgets for the user
    cursor.execute('''
        SELECT category, monthly_limit, currency
        FROM budgets
        WHERE user_id = ?
    ''', (user_id,))
    budgets = {row['category']: {'limit': row['monthly_limit'], 'currency': row['currency']} for row in cursor.fetchall()}
    
    conn.close()
    
    # Organize categories under each currency
    categories_by_currency = {}
    for r in rows:
        cur = r['currency'] or 'INR'
        if cur not in categories_by_currency:
            categories_by_currency[cur] = []
        category_data = {'category': r['category'], 'total': float(r['total'])}
        # Add budget info if exists
        if r['category'] in budgets and budgets[r['category']]['currency'] == cur:
            category_data['budget_limit'] = budgets[r['category']]['limit']
            category_data['budget_percentage'] = (float(r['total']) / budgets[r['category']]['limit']) * 100
        categories_by_currency[cur].append(category_data)

    # Ensure totals are floats
    totals_by_currency = [{'currency': t['currency'] or 'INR', 'total': float(t['total'])} for t in totals_by_currency]

    return jsonify({
        'totals': totals_by_currency,
        'categories': categories_by_currency
    }), 200

@app.route('/api/insights', methods=['GET'])
@login_required
def get_insights():
    user_id = session['user_id']
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not month or not year:
        return jsonify({'error': 'Month and year are required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get current month total
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
    ''', (user_id, year, month.zfill(2)))
    current_month_total = cursor.fetchone()['total'] or 0
    
    # Get previous month total
    prev_month = int(month) - 1
    prev_year = year
    if prev_month == 0:
        prev_month = 12
        prev_year = str(int(year) - 1)
    
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
    ''', (user_id, prev_year, str(prev_month).zfill(2)))
    prev_month_total = cursor.fetchone()['total'] or 0
    
    # Get current week total (last 7 days)
    from datetime import datetime, timedelta
    today = datetime.now()
    week_ago = today - timedelta(days=7)
    week_start = week_ago.strftime('%Y-%m-%d')
    week_end = today.strftime('%Y-%m-%d')
    
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
    ''', (user_id, week_start, week_end))
    current_week_total = cursor.fetchone()['total'] or 0
    
    # Get previous week total
    prev_week_start = (week_ago - timedelta(days=7)).strftime('%Y-%m-%d')
    prev_week_end = week_ago.strftime('%Y-%m-%d')
    
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
    ''', (user_id, prev_week_start, prev_week_end))
    prev_week_total = cursor.fetchone()['total'] or 0
    
    # Get category breakdown for current month
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
        GROUP BY category
        ORDER BY total DESC
    ''', (user_id, year, month.zfill(2)))
    current_categories = [dict(row) for row in cursor.fetchall()]
    
    # Get category breakdown for previous month
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
        GROUP BY category
        ORDER BY total DESC
    ''', (user_id, prev_year, str(prev_month).zfill(2)))
    prev_categories = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # Generate insights
    insights = []
    
    # Week-over-week comparison
    if prev_week_total > 0:
        week_change_pct = ((current_week_total - prev_week_total) / prev_week_total) * 100
        if abs(week_change_pct) >= 5:  # Only show if significant change
            direction = "more" if week_change_pct > 0 else "less"
            insights.append(f"You spent {abs(week_change_pct):.0f}% {direction} this week than last week.")
    
    # Month-over-month comparison
    if prev_month_total > 0:
        month_change_pct = ((current_month_total - prev_month_total) / prev_month_total) * 100
        if abs(month_change_pct) >= 5:
            direction = "more" if month_change_pct > 0 else "less"
            insights.append(f"You spent {abs(month_change_pct):.0f}% {direction} this month than last month.")
    
    # Highest spending category
    if current_categories:
        highest_category = current_categories[0]['category']
        insights.append(f"{highest_category} was your highest expense category this month.")
    
    # Category trends
    prev_cat_dict = {cat['category']: cat['total'] for cat in prev_categories}
    for cat in current_categories:
        cat_name = cat['category']
        current_total = cat['total']
        prev_total = prev_cat_dict.get(cat_name, 0)
        
        if prev_total > 0 and current_total != prev_total:
            change_pct = ((current_total - prev_total) / prev_total) * 100
            if abs(change_pct) >= 10:  # Only show significant changes
                direction = "increased" if change_pct > 0 else "decreased"
                insights.append(f"{cat_name} expenses {direction} compared to last month.")
    
    # Unusually high spending detection (compare to historical average)
    if len(current_categories) > 0:
        # Get last 3 months average for comparison
        months_to_check = []
        for i in range(1, 4):
            m = int(month) - i
            y = year
            if m <= 0:
                m += 12
                y = str(int(y) - 1)
            months_to_check.append((y, str(m).zfill(2)))
        
        total_historical = 0
        count = 0
        hist_conn = get_db()
        hist_cursor = hist_conn.cursor()
        for hist_year, hist_month in months_to_check:
            hist_cursor.execute('''
                SELECT COALESCE(SUM(amount), 0) as total
                FROM expenses
                WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
            ''', (user_id, hist_year, hist_month))
            hist_total = hist_cursor.fetchone()['total'] or 0
            if hist_total > 0:
                total_historical += hist_total
                count += 1
        hist_conn.close()
        
        if count > 0:
            avg_historical = total_historical / count
            if current_month_total > avg_historical * 1.2:  # 20% above average
                insights.append("Your spending this month is unusually high compared to recent months.")
    
    return jsonify({'insights': insights}), 200

@app.route('/api/category-insights', methods=['GET'])
@login_required
def get_category_insights():
    """Get detailed insights for a specific category in a given month"""
    user_id = session['user_id']
    category = request.args.get('category')
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not category or not month or not year:
        return jsonify({'error': 'Category, month, and year are required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get total spent in this category this month
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND category = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
    ''', (user_id, category, year, month.zfill(2)))
    category_total = cursor.fetchone()['total'] or 0
    
    # Get total spent in all categories this month (for percentage)
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
    ''', (user_id, year, month.zfill(2)))
    month_total = cursor.fetchone()['total'] or 0
    
    # Get number of days in the month
    from calendar import monthrange
    days_in_month = monthrange(int(year), int(month))[1]
    
    # Get budget for this category
    cursor.execute('''
        SELECT monthly_limit, currency
        FROM budgets
        WHERE user_id = ? AND category = ?
    ''', (user_id, category))
    budget_row = cursor.fetchone()
    budget_limit = budget_row['monthly_limit'] if budget_row else None
    budget_currency = budget_row['currency'] if budget_row else None
    
    conn.close()
    
    percentage_of_total = (category_total / month_total * 100) if month_total > 0 else 0
    avg_per_day = category_total / days_in_month if days_in_month > 0 else 0
    budget_remaining = (budget_limit - category_total) if budget_limit else None
    
    return jsonify({
        'category': category,
        'total_spent': float(category_total),
        'percentage_of_total': float(percentage_of_total),
        'average_per_day': float(avg_per_day),
        'budget_limit': float(budget_limit) if budget_limit else None,
        'budget_remaining': float(budget_remaining) if budget_remaining is not None else None,
        'budget_currency': budget_currency or 'INR'
    }), 200

@app.route('/api/spending-trends', methods=['GET'])
@login_required
def get_spending_trends():
    """Get spending trend data for period comparison (weekly/monthly)"""
    user_id = session['user_id']
    period = request.args.get('period', 'weekly')  # 'weekly' or 'monthly'
    start_date = request.args.get('start_date')  # YYYY-MM-DD format
    
    if not start_date:
        return jsonify({'error': 'start_date is required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        current_start = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        # Calculate period boundaries and previous period
        if period == 'weekly':
            current_end = current_start + timedelta(days=6)
            prev_start = current_start - timedelta(days=7)
            prev_end = prev_start + timedelta(days=6)
        else:  # monthly
            # Get last day of current month
            current_end = current_start + relativedelta(months=1) - timedelta(days=1)
            # Get previous month same range
            prev_start = current_start - relativedelta(months=1)
            prev_end = prev_start + relativedelta(months=1) - timedelta(days=1)
        
        # Get current period total
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        ''', (user_id, current_start.isoformat(), current_end.isoformat()))
        current_total = cursor.fetchone()['total'] or 0
        
        # Get previous period total
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE user_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL
        ''', (user_id, prev_start.isoformat(), prev_end.isoformat()))
        prev_total = cursor.fetchone()['total'] or 0
        
        conn.close()
        
        # Calculate trend
        if prev_total > 0:
            percentage_change = ((current_total - prev_total) / prev_total) * 100
            direction = 'up' if percentage_change > 0 else 'down' if percentage_change < 0 else 'no-change'
        else:
            percentage_change = 0
            direction = 'no-change'
        
        return jsonify({
            'current_total': float(current_total),
            'previous_total': float(prev_total),
            'percentage_change': float(percentage_change),
            'direction': direction
        }), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

@app.route('/api/month-comparison', methods=['GET'])
@login_required
def get_month_comparison():
    user_id = session['user_id']
    month1 = request.args.get('month1')
    year1 = request.args.get('year1')
    month2 = request.args.get('month2')
    year2 = request.args.get('year2')
    
    if not all([month1, year1, month2, year2]):
        return jsonify({'error': 'All month and year parameters are required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get totals for both months
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
    ''', (user_id, year1, month1.zfill(2)))
    total1 = cursor.fetchone()['total'] or 0
    
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
    ''', (user_id, year2, month2.zfill(2)))
    total2 = cursor.fetchone()['total'] or 0
    
    # Get category breakdowns
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
        GROUP BY category
    ''', (user_id, year1, month1.zfill(2)))
    categories1 = {row['category']: row['total'] for row in cursor.fetchall()}
    
    cursor.execute('''
        SELECT category, COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
        GROUP BY category
    ''', (user_id, year2, month2.zfill(2)))
    categories2 = {row['category']: row['total'] for row in cursor.fetchall()}
    
    conn.close()
    
    # Calculate differences
    total_diff = total2 - total1
    total_diff_pct = ((total2 - total1) / total1 * 100) if total1 > 0 else 0
    
    # Category differences
    all_categories = set(categories1.keys()) | set(categories2.keys())
    category_diffs = []
    
    for category in all_categories:
        amt1 = categories1.get(category, 0)
        amt2 = categories2.get(category, 0)
        diff = amt2 - amt1
        diff_pct = ((amt2 - amt1) / amt1 * 100) if amt1 > 0 else 0
        
        trend = 'up' if diff > 0 else 'down' if diff < 0 else 'no-change'
        
        category_diffs.append({
            'category': category,
            'amount1': amt1,
            'amount2': amt2,
            'difference': diff,
            'percentage_change': diff_pct,
            'trend': trend
        })
    
    # Sort by absolute difference
    category_diffs.sort(key=lambda x: abs(x['difference']), reverse=True)
    
    return jsonify({
        'total1': total1,
        'total2': total2,
        'total_difference': total_diff,
        'total_percentage_change': total_diff_pct,
        'categories': category_diffs
    }), 200

# ==================== RECURRING EXPENSES & SUBSCRIPTIONS ====================

@app.route('/api/recurring', methods=['GET'])
@login_required
def get_recurring():
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, amount, category, frequency, start_date, last_added_date, 
               auto_add, is_active, currency, created_at
        FROM recurring_expenses
        WHERE user_id = ? AND is_active = 1
        ORDER BY created_at DESC
    ''', (user_id,))
    recurring = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(recurring), 200

@app.route('/api/recurring', methods=['POST'])
@login_required
def create_recurring():
    user_id = session['user_id']
    data = request.get_json()
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO recurring_expenses (user_id, name, amount, category, frequency, start_date, auto_add, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, data['name'], data['amount'], data['category'], data['frequency'], 
              data['start_date'], data.get('auto_add', 1), data.get('currency', 'INR')))
        conn.commit()
        recurring_id = cursor.lastrowid
        conn.close()
        
        log_activity(user_id, 'Created recurring expense', 'recurring_expense', recurring_id, data['name'])
        
        return jsonify({'id': recurring_id, 'message': 'Recurring expense created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/recurring/<int:recurring_id>', methods=['PUT'])
@login_required
def update_recurring(recurring_id):
    user_id = session['user_id']
    data = request.get_json()
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute('SELECT id FROM recurring_expenses WHERE id = ? AND user_id = ?', (recurring_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Recurring expense not found'}), 404
        
        cursor.execute('''
            UPDATE recurring_expenses
            SET name = ?, amount = ?, category = ?, frequency = ?, start_date = ?, 
                auto_add = ?, currency = ?, updated_at = ?
            WHERE id = ? AND user_id = ?
        ''', (data['name'], data['amount'], data['category'], data['frequency'], 
              data['start_date'], data.get('auto_add', 1), data.get('currency', 'INR'),
              datetime.now().isoformat(), recurring_id, user_id))
        conn.commit()
        conn.close()
        
        log_activity(user_id, 'Updated recurring expense', 'recurring_expense', recurring_id, data['name'])
        
        return jsonify({'message': 'Recurring expense updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/recurring/<int:recurring_id>', methods=['DELETE'])
@login_required
def delete_recurring(recurring_id):
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute('SELECT id FROM recurring_expenses WHERE id = ? AND user_id = ?', (recurring_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Recurring expense not found'}), 404
        
        cursor.execute('UPDATE recurring_expenses SET is_active = 0 WHERE id = ?', (recurring_id,))
        conn.commit()
        conn.close()
        
        log_activity(user_id, 'Deleted recurring expense', 'recurring_expense', recurring_id)
        
        return jsonify({'message': 'Recurring expense deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/subscriptions', methods=['GET'])
@login_required
def get_subscriptions():
    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, service_name, amount, billing_cycle, renewal_date, category, 
               is_paused, last_expense_date, currency, created_at
        FROM subscriptions
        WHERE user_id = ?
        ORDER BY created_at DESC
    ''', (user_id,))
    subscriptions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    # Calculate monthly cost
    total_monthly = sum(sub['amount'] for sub in subscriptions if not sub['is_paused'] and sub['billing_cycle'] == 'Monthly')
    
    return jsonify({'subscriptions': subscriptions, 'total_monthly_cost': total_monthly}), 200

@app.route('/api/subscriptions', methods=['POST'])
@login_required
def create_subscription():
    user_id = session['user_id']
    data = request.get_json()
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO subscriptions (user_id, service_name, amount, billing_cycle, renewal_date, category, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, data['service_name'], data['amount'], data['billing_cycle'], 
              data['renewal_date'], data.get('category', 'Subscriptions'), data.get('currency', 'INR')))
        conn.commit()
        subscription_id = cursor.lastrowid
        conn.close()
        
        log_activity(user_id, 'Created subscription', 'subscription', subscription_id, data['service_name'])
        
        return jsonify({'id': subscription_id, 'message': 'Subscription created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/subscriptions/<int:subscription_id>', methods=['PUT'])
@login_required
def update_subscription(subscription_id):
    user_id = session['user_id']
    data = request.get_json()
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute('SELECT id FROM subscriptions WHERE id = ? AND user_id = ?', (subscription_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Subscription not found'}), 404
        
        cursor.execute('''
            UPDATE subscriptions
            SET service_name = ?, amount = ?, billing_cycle = ?, renewal_date = ?, 
                category = ?, is_paused = ?, currency = ?, updated_at = ?
            WHERE id = ? AND user_id = ?
        ''', (data['service_name'], data['amount'], data['billing_cycle'], data['renewal_date'],
              data.get('category', 'Subscriptions'), data.get('is_paused', 0), data.get('currency', 'INR'),
              datetime.now().isoformat(), subscription_id, user_id))
        conn.commit()
        conn.close()
        
        log_activity(user_id, 'Updated subscription', 'subscription', subscription_id, data['service_name'])
        
        return jsonify({'message': 'Subscription updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/subscriptions/<int:subscription_id>', methods=['DELETE'])
@login_required
def delete_subscription(subscription_id):
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute('SELECT id FROM subscriptions WHERE id = ? AND user_id = ?', (subscription_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Subscription not found'}), 404
        
        cursor.execute('DELETE FROM subscriptions WHERE id = ?', (subscription_id,))
        conn.commit()
        conn.close()
        
        log_activity(user_id, 'Deleted subscription', 'subscription', subscription_id)
        
        return jsonify({'message': 'Subscription deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ==================== REPORTS ====================

@app.route('/api/reports/monthly', methods=['GET'])
@login_required
@analytics_enabled
def get_monthly_report():
    user_id = session['user_id']
    month = request.args.get('month', str(datetime.now().month))
    year = request.args.get('year', str(datetime.now().year))
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get total expenses
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
        ''', (user_id, year, month.zfill(2)))
        total = cursor.fetchone()['total'] or 0
        
        # Get category breakdown
        cursor.execute('''
            SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
            GROUP BY category
            ORDER BY total DESC
        ''', (user_id, year, month.zfill(2)))
        categories = [dict(row) for row in cursor.fetchall()]
        
        # Get top expenses
        cursor.execute('''
            SELECT id, amount, category, date, notes
            FROM expenses
            WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
            ORDER BY amount DESC
            LIMIT 10
        ''', (user_id, year, month.zfill(2)))
        top_expenses = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'month': month,
            'year': year,
            'total': total,
            'categories': categories,
            'top_expenses': top_expenses
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/reports/category', methods=['GET'])
@login_required
@analytics_enabled
def get_category_report():
    user_id = session['user_id']
    month = request.args.get('month', str(datetime.now().month))
    year = request.args.get('year', str(datetime.now().year))
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get category breakdown with percentages
        cursor.execute('''
            SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ? AND deleted_at IS NULL
            GROUP BY category
            ORDER BY total DESC
        ''', (user_id, year, month.zfill(2)))
        categories = []
        total_amount = 0
        for row in cursor.fetchall():
            categories.append(dict(row))
            total_amount += row['total']
        
        # Calculate percentages
        for cat in categories:
            cat['percentage'] = (cat['total'] / total_amount * 100) if total_amount > 0 else 0
        
        conn.close()
        
        return jsonify({
            'month': month,
            'year': year,
            'total': total_amount,
            'categories': categories
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/reports/yearly', methods=['GET'])
@login_required
@analytics_enabled
def get_yearly_report():
    user_id = session['user_id']
    year = request.args.get('year', str(datetime.now().year))
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get monthly breakdown
        cursor.execute('''
            SELECT strftime('%m', date) as month, COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE user_id = ? AND strftime('%Y', date) = ? AND deleted_at IS NULL
            GROUP BY strftime('%m', date)
            ORDER BY month
        ''', (user_id, year))
        monthly_data = [dict(row) for row in cursor.fetchall()]
        
        # Get total for year
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE user_id = ? AND strftime('%Y', date) = ? AND deleted_at IS NULL
        ''', (user_id, year))
        total = cursor.fetchone()['total'] or 0
        
        # Get category breakdown for year
        cursor.execute('''
            SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE user_id = ? AND strftime('%Y', date) = ? AND deleted_at IS NULL
            GROUP BY category
            ORDER BY total DESC
        ''', (user_id, year))
        categories = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'year': year,
            'total': total,
            'monthly_data': monthly_data,
            'categories': categories
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ==================== ACTIVITY HISTORY & AUDIT LOG ====================

@app.route('/api/activity', methods=['GET'])
@login_required
def get_activity():
    user_id = session['user_id']
    limit = request.args.get('limit', 100, type=int)
    activity_type = request.args.get('type', None)
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        if activity_type:
            cursor.execute('''
                SELECT id, timestamp, action, entity_type, entity_id, metadata
                FROM activity_log
                WHERE user_id = ? AND entity_type = ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (user_id, activity_type, limit))
        else:
            cursor.execute('''
                SELECT id, timestamp, action, entity_type, entity_id, metadata
                FROM activity_log
                WHERE user_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (user_id, limit))
        
        activities = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(activities), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/activity/summary', methods=['GET'])
@login_required
def get_activity_summary():
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get activity counts by type
        cursor.execute('''
            SELECT action, COUNT(*) as count
            FROM activity_log
            WHERE user_id = ?
            GROUP BY action
            ORDER BY count DESC
        ''', (user_id,))
        action_counts = [dict(row) for row in cursor.fetchall()]
        
        # Get entity type counts
        cursor.execute('''
            SELECT entity_type, COUNT(*) as count
            FROM activity_log
            WHERE user_id = ?
            GROUP BY entity_type
            ORDER BY count DESC
        ''', (user_id,))
        entity_counts = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'actions': action_counts,
            'entities': entity_counts
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
