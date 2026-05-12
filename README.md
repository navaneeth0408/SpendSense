# Daily Expense Tracker

A simple and clean web application for tracking daily expenses with user authentication and monthly summaries.

## Features

- User registration and login
- Add, edit, and delete expenses
- Each expense includes:
  - Amount
  - Category
  - Date
  - Optional notes
- Monthly summary view with:
  - Total expenses for the selected month
  - Category-wise expense breakdown
  - Highlighted monthly total

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://localhost:5000
```

## Usage

1. Register a new account or login with existing credentials
2. Select a month using the month selector
3. Add expenses by filling out the form
4. View monthly summary to see total expenses and category breakdown
5. Edit or delete expenses as needed

## Technology Stack

- **Backend**: Flask (Python)
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Authentication**: Flask sessions with bcrypt password hashing

