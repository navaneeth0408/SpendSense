#!/usr/bin/env python3
"""
Session Persistence Verification Script

This script verifies that all session persistence fixes have been properly
implemented in the SpendSense expense tracker application.

Usage:
    python verify_session_persistence.py
"""

import os
import sys
import re
from pathlib import Path

def check_file_exists(filepath):
    """Check if a file exists."""
    if os.path.exists(filepath):
        print(f"✅ File exists: {filepath}")
        return True
    else:
        print(f"❌ File missing: {filepath}")
        return False

def check_secret_key_fixed(filepath):
    """Verify secret key is fixed, not random."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check for fixed secret key
    if "app.secret_key = 'spendsense-dev-secret-key-2026'" in content:
        print("✅ Secret key is FIXED (not random)")
        return True
    elif "app.secret_key = os.urandom(24)" in content:
        print("❌ Secret key is RANDOM - this breaks session persistence!")
        return False
    else:
        print("⚠️  Secret key not found or in unexpected format")
        return False

def check_session_configuration(filepath):
    """Verify session configuration is set."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    required_configs = [
        "SESSION_COOKIE_SECURE",
        "SESSION_COOKIE_HTTPONLY",
        "SESSION_COOKIE_SAMESITE",
        "PERMANENT_SESSION_LIFETIME",
        "SESSION_REFRESH_EACH_REQUEST"
    ]
    
    missing = []
    for config in required_configs:
        if config not in content:
            missing.append(config)
    
    if missing:
        print(f"❌ Missing session configurations: {', '.join(missing)}")
        return False
    else:
        print("✅ All session configurations are set")
        return True

def check_session_permanent_in_login(filepath):
    """Verify session.permanent = True is set in login route."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find login route
    login_pattern = r"@app\.route\('/api/login'.*?\).*?def login\(\):(.*?)(?=@app\.route|def )"
    login_match = re.search(login_pattern, content, re.DOTALL)
    
    if login_match:
        login_code = login_match.group(1)
        if "session.permanent = True" in login_code:
            print("✅ Login route sets session.permanent = True")
            return True
        else:
            print("❌ Login route does NOT set session.permanent = True")
            return False
    else:
        print("⚠️  Could not find login route")
        return False

def check_session_permanent_in_register(filepath):
    """Verify session.permanent = True is set in register route."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find register route
    register_pattern = r"@app\.route\('/api/register'.*?\).*?def register\(\):(.*?)(?=@app\.route|def )"
    register_match = re.search(register_pattern, content, re.DOTALL)
    
    if register_match:
        register_code = register_match.group(1)
        if "session.permanent = True" in register_code:
            print("✅ Register route sets session.permanent = True")
            return True
        else:
            print("❌ Register route does NOT set session.permanent = True")
            return False
    else:
        print("⚠️  Could not find register route")
        return False

def check_frontend_checkauth_logging(filepath):
    """Verify frontend checkAuth function has logging."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    if "console.log('[checkAuth]" in content:
        print("✅ Frontend checkAuth function has logging")
        return True
    else:
        print("❌ Frontend checkAuth function missing [checkAuth] logging")
        return False

def check_frontend_logout_logging(filepath):
    """Verify frontend handleLogout function has logging."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    if "console.log('[Logout]" in content:
        print("✅ Frontend handleLogout function has logging")
        return True
    else:
        print("❌ Frontend handleLogout function missing [Logout] logging")
        return False

def main():
    """Run all verification checks."""
    print("=" * 70)
    print("🔍 Session Persistence Implementation Verification")
    print("=" * 70)
    print()
    
    # File paths
    app_file = "app.py"
    js_file = "static/js/app.js"
    
    # Check if files exist
    print("📁 Checking required files:")
    if not check_file_exists(app_file):
        print("\n❌ Cannot find app.py - please run this script from project root")
        return False
    if not check_file_exists(js_file):
        print("\n❌ Cannot find static/js/app.js - please run this script from project root")
        return False
    print()
    
    # Run backend checks
    print("🔧 Backend Verification (app.py):")
    backend_checks = [
        ("Secret Key Fixed", lambda: check_secret_key_fixed(app_file)),
        ("Session Configuration", lambda: check_session_configuration(app_file)),
        ("Login Route session.permanent", lambda: check_session_permanent_in_login(app_file)),
        ("Register Route session.permanent", lambda: check_session_permanent_in_register(app_file)),
    ]
    
    backend_results = []
    for check_name, check_func in backend_checks:
        try:
            result = check_func()
            backend_results.append(result)
        except Exception as e:
            print(f"❌ Error checking {check_name}: {e}")
            backend_results.append(False)
    print()
    
    # Run frontend checks
    print("🎨 Frontend Verification (static/js/app.js):")
    frontend_checks = [
        ("checkAuth Logging", lambda: check_frontend_checkauth_logging(js_file)),
        ("Logout Logging", lambda: check_frontend_logout_logging(js_file)),
    ]
    
    frontend_results = []
    for check_name, check_func in frontend_checks:
        try:
            result = check_func()
            frontend_results.append(result)
        except Exception as e:
            print(f"❌ Error checking {check_name}: {e}")
            frontend_results.append(False)
    print()
    
    # Summary
    all_results = backend_results + frontend_results
    passed = sum(all_results)
    total = len(all_results)
    
    print("=" * 70)
    print(f"📊 Verification Summary: {passed}/{total} checks passed")
    print("=" * 70)
    print()
    
    if all(all_results):
        print("✅ ALL CHECKS PASSED - Session persistence is properly implemented!")
        print()
        print("🚀 Next Steps:")
        print("   1. Start Flask server: python app.py")
        print("   2. Open http://127.0.0.1:5000 in browser")
        print("   3. Register a new account")
        print("   4. Refresh page (F5) - dashboard should persist")
        print("   5. Stop/restart Flask and refresh - session should survive")
        print()
        return True
    else:
        print("❌ SOME CHECKS FAILED - Please review the issues above")
        print()
        print("🔧 Troubleshooting:")
        print("   1. Verify you've applied all fixes from SESSION_PERSISTENCE_IMPLEMENTATION_SUMMARY.md")
        print("   2. Check that app.py secret_key is the FIXED string value")
        print("   3. Check that session.permanent = True is set in login/register")
        print("   4. Verify session configuration lines are present")
        print()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
