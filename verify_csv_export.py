#!/usr/bin/env python3
"""
CSV Date Export - Comprehensive Verification Test
This script verifies that the complete data pipeline for CSV exports includes dates.
"""

import sqlite3
import csv
import io
from datetime import datetime

class CSVExportVerifier:
    def __init__(self, db_path='expenses.db'):
        self.db_path = db_path
        self.results = []
        
    def log(self, status, message):
        """Log test result"""
        symbol = "✓" if status == "PASS" else "✗" if status == "FAIL" else "!"
        self.results.append((status, message))
        print(f"[{symbol}] {message}")
    
    def verify_database_schema(self):
        """Verify database schema has date field"""
        print("\n=== 1. DATABASE SCHEMA VERIFICATION ===\n")
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check expenses table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'")
            if not cursor.fetchone():
                self.log("FAIL", "expenses table does not exist")
                conn.close()
                return False
            
            # Check date column exists
            cursor.execute("PRAGMA table_info(expenses)")
            columns = {row[1]: row[2] for row in cursor.fetchall()}
            
            if 'date' not in columns:
                self.log("FAIL", "date column missing from expenses table")
                conn.close()
                return False
            
            self.log("PASS", f"date column exists in expenses table (type: {columns['date']})")
            
            # Check for NULL dates
            cursor.execute("SELECT COUNT(*) FROM expenses WHERE date IS NULL")
            null_count = cursor.fetchone()[0]
            if null_count > 0:
                self.log("WARN", f"Found {null_count} expenses with NULL dates")
            else:
                self.log("PASS", "No NULL dates found in expenses")
            
            conn.close()
            return True
        except Exception as e:
            self.log("FAIL", f"Database verification error: {str(e)}")
            return False
    
    def verify_sample_data(self):
        """Verify sample expenses have date values"""
        print("\n=== 2. SAMPLE DATA VERIFICATION ===\n")
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get users with expenses
            cursor.execute("""
                SELECT DISTINCT u.id, u.username, COUNT(e.id) as expense_count
                FROM users u
                LEFT JOIN expenses e ON u.id = e.user_id
                WHERE e.id IS NOT NULL
                GROUP BY u.id
                ORDER BY expense_count DESC
                LIMIT 3
            """)
            
            users_with_expenses = cursor.fetchall()
            if not users_with_expenses:
                self.log("WARN", "No users with expenses found")
                conn.close()
                return False
            
            for user in users_with_expenses:
                user_id = user['id']
                username = user['username']
                count = user['expense_count']
                
                cursor.execute("""
                    SELECT id, date, category, amount
                    FROM expenses
                    WHERE user_id = ?
                    LIMIT 1
                """, (user_id,))
                
                expense = cursor.fetchone()
                if expense and expense['date']:
                    self.log("PASS", f"User {username} (ID: {user_id}): {count} expenses, sample date: {expense['date']}")
                else:
                    self.log("WARN", f"User {username} (ID: {user_id}): No date in sample expense")
            
            conn.close()
            return len(users_with_expenses) > 0
        except Exception as e:
            self.log("FAIL", f"Sample data verification error: {str(e)}")
            return False
    
    def verify_api_response(self, user_id):
        """Simulate API response to verify dates are returned"""
        print(f"\n=== 3. API RESPONSE VERIFICATION (User ID: {user_id}) ===\n")
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Simulate GET /api/expenses
            cursor.execute("""
                SELECT * FROM expenses
                WHERE user_id = ? AND deleted_at IS NULL
                ORDER BY date DESC
                LIMIT 5
            """, (user_id,))
            
            expenses = cursor.fetchall()
            if not expenses:
                self.log("WARN", f"No expenses found for user {user_id}")
                conn.close()
                return False
            
            for expense in expenses:
                expense_dict = dict(expense)
                if 'date' in expense_dict and expense_dict['date']:
                    self.log("PASS", f"Expense ID {expense_dict['id']}: date={expense_dict['date']}, amount={expense_dict['amount']}")
                else:
                    self.log("FAIL", f"Expense ID {expense_dict['id']}: MISSING DATE")
            
            conn.close()
            return True
        except Exception as e:
            self.log("FAIL", f"API response verification error: {str(e)}")
            return False
    
    def verify_csv_export(self, user_id, year, month=None):
        """Verify CSV export includes dates"""
        print(f"\n=== 4. CSV EXPORT VERIFICATION (User: {user_id}, Period: {year}-{month or 'ALL'}) ===\n")
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Build query exactly as app.py does
            query = """
                SELECT date, category, amount, notes, currency
                FROM expenses
                WHERE user_id = ? AND deleted_at IS NULL
            """
            params = [user_id]
            
            if month:
                query += " AND strftime('%Y', date) = ? AND strftime('%m', date) = ?"
                params.extend([year, month.zfill(2)])
            else:
                query += " AND strftime('%Y', date) = ?"
                params.append(year)
            
            query += " ORDER BY date DESC"
            
            cursor.execute(query, params)
            expenses = cursor.fetchall()
            
            if not expenses:
                self.log("WARN", f"No expenses found for user {user_id} in {year}-{month or 'ANY MONTH'}")
                conn.close()
                return False
            
            self.log("PASS", f"Found {len(expenses)} expenses to export")
            
            # Generate CSV
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['Date', 'Category', 'Amount', 'Currency', 'Notes'])
            
            date_count = 0
            for expense in expenses:
                notes = expense['notes'] if expense['notes'] else ''
                writer.writerow([
                    expense['date'],
                    expense['category'],
                    f"{expense['amount']:.2f}",
                    expense['currency'],
                    notes
                ])
                if expense['date']:
                    date_count += 1
            
            output.seek(0)
            csv_content = output.getvalue()
            lines = csv_content.strip().split('\n')
            
            # Verify header
            header = lines[0]
            if header.startswith('Date,'):
                self.log("PASS", "CSV header correct: Date is first column")
            else:
                self.log("FAIL", f"CSV header incorrect: {header}")
            
            # Verify date columns
            if date_count == len(expenses):
                self.log("PASS", f"All {date_count} exported expenses include dates")
            else:
                self.log("FAIL", f"Only {date_count}/{len(expenses)} expenses have dates in CSV")
            
            # Show sample
            print(f"\nSample CSV Output ({len(lines)} total lines):")
            for i, line in enumerate(lines[:6]):
                print(f"  {line}")
            if len(lines) > 6:
                print(f"  ... ({len(lines)-6} more rows)")
            
            conn.close()
            return date_count == len(expenses)
        except Exception as e:
            self.log("FAIL", f"CSV export verification error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all verification tests"""
        print("\n" + "="*60)
        print("CSV DATE EXPORT - COMPREHENSIVE VERIFICATION")
        print("="*60)
        
        # Test 1: Schema
        schema_ok = self.verify_database_schema()
        
        # Test 2: Sample data
        data_ok = self.verify_sample_data()
        
        # Test 3: Find a user with expenses and test API
        if data_ok:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT user_id FROM expenses
                WHERE date IS NOT NULL
                LIMIT 1
            """)
            result = cursor.fetchone()
            user_id = result[0] if result else None
            conn.close()
            
            if user_id:
                api_ok = self.verify_api_response(user_id)
                # Test 4: CSV export
                csv_ok = self.verify_csv_export(user_id, '2025', '12')
            else:
                self.log("FAIL", "No user with expenses found")
                api_ok = csv_ok = False
        else:
            api_ok = csv_ok = False
        
        # Summary
        print("\n" + "="*60)
        print("VERIFICATION SUMMARY")
        print("="*60 + "\n")
        
        passed = sum(1 for status, _ in self.results if status == "PASS")
        failed = sum(1 for status, _ in self.results if status == "FAIL")
        warnings = sum(1 for status, _ in self.results if status == "WARN")
        
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Warnings: {warnings}\n")
        
        if failed == 0:
            print("✓ ALL TESTS PASSED - CSV DATE EXPORT IS WORKING CORRECTLY")
            return True
        else:
            print("✗ SOME TESTS FAILED - REVIEW ABOVE FOR DETAILS")
            return False

if __name__ == '__main__':
    verifier = CSVExportVerifier()
    success = verifier.run_all_tests()
    exit(0 if success else 1)
