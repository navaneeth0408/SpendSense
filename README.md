# 💰 SpendSense

AI-powered personal finance manager with advanced analytics and session persistence.

## What It Does
SpendSense is a comprehensive expense tracking and financial management platform designed to provide users with a clear overview of their spending habits. It allows users to log transactions, set and monitor category-based budgets, manage recurring subscriptions, and generate detailed financial reports in CSV, Excel, or PDF formats. The system features an intelligent analytics dashboard that detects spending spikes and provides behavioral insights, all within a sleek, premium dark-mode interface.

## Features
- **Expense Tracking**: Easily log and categorize daily transactions with notes and multi-currency support (INR, USD, etc.).
- **Budget Management**: Set monthly limits for different categories and track spending progress with real-time alerts.
- **Advanced Analytics**: Visual dashboards featuring spending trends, category breakdowns, and budget-vs-actual comparisons using Chart.js.
- **Smart Insights**: Automated spike detection and AI-style behavioral recommendations to help optimize spending.
- **Recurring Expenses & Subscriptions**: Manage monthly bills and active subscriptions in a dedicated module.
- **Multi-Format Export**: Generate professional reports in CSV, Excel (openpyxl), or PDF (reportlab).
- **Secure Authentication**: Robust user login system with session persistence and encrypted passwords using Bcrypt.
- **Premium UI**: Responsive "Golden Theme" dark mode designed for a seamless desktop and mobile experience.

## Tech Stack
| Component | Technology |
| :--- | :--- |
| **Backend** | Python / Flask |
| **Database** | SQLite3 |
| **Frontend** | HTML5, CSS3, Vanilla JS |
| **Charting** | Chart.js |
| **Authentication** | Flask-Bcrypt |
| **Reporting** | Openpyxl (Excel), ReportLab (PDF) |

## How It Works
SpendSense follows a classic client-server architecture with a lightweight Flask backend and a modern responsive frontend.

```text
[ Browser ] <---> [ Flask Server ] <---> [ SQLite DB ]
    |                |                   |
    |-- JS/Charts ---|-- Auth/Bcrypt ----|-- Tables: Users
    |-- CSS/Theme ---|-- Data Aggregation|-- Tables: Expenses
    |-- HTML Templates|-- Report Generation|-- Tables: Budgets
```

## Getting Started

### Prerequisites
- Python 3.8+
- Pip (Python package manager)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/navaneeth0408/SpendSense.git
   cd SpendSense
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Run Instructions
1. Run the Flask application:
   ```bash
   python app.py
   ```
2. Access the application in your browser:
   ```
   http://127.0.0.1:5000
   ```

## API Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | GET | Landing and login/register page |
| `/analytics` | GET | Main analytics dashboard interface |
| `/settings` | GET | User profile and application settings |
| `/reports` | GET | Report generation and export interface |
| `/api/analytics/overview` | GET | Returns key stats (total, avg, pct change) |
| `/api/analytics/categories` | GET | Returns spending breakdown by category |
| `/api/analytics/trend` | GET | Returns time-series data for spending charts |
| `/api/analytics/budget-vs-actual`| GET | Returns budget utilization data |
| `/api/analytics/spike-detector` | GET | Identifies unusually high daily spending |
| `/api/drilldown` | GET | Fetches transactions for a specific category |

## Project Structure
```text
SpendSense/
├── app.py              # Main application logic & API routes
├── requirements.txt    # Python dependencies
├── expenses.db         # SQLite database storage
├── static/             # Static assets
│   ├── css/            # Stylesheets (Golden Theme)
│   ├── js/             # Frontend logic & Chart.js implementations
│   └── img/            # UI icons and images
├── templates/          # HTML templates
└── docs/               # Technical documentation & guides
```

## Author
**Navaneeth**
- [LinkedIn](https://www.linkedin.com/in/navaneeth-m-545175257)
- [GitHub](https://github.com/navaneeth0408)
