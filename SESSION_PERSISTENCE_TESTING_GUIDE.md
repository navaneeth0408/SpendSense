# Session Persistence Testing Guide

## Overview
This guide will help you verify that login session persistence has been properly fixed in SpendSense. The critical issue was that Flask was regenerating its secret key on every restart, invalidating all sessions.

---

## ✅ Pre-Test Checklist

Before testing, ensure all fixes are in place:

1. **Flask App Configuration** ✓
   - Fixed secret key: `'spendsense-dev-secret-key-2026'`
   - Session cookie settings configured (HTTPONLY, SAMESITE, SECURE)
   - PERMANENT_SESSION_LIFETIME set to 7 days
   - SESSION_REFRESH_EACH_REQUEST enabled

2. **Backend Routes Enhanced** ✓
   - `/api/register` sets `session.permanent = True`
   - `/api/login` sets `session.permanent = True`
   - `/api/check-auth` validates session state
   - `/api/logout` clears session properly

3. **Frontend Enhanced** ✓
   - `checkAuth()` has detailed logging
   - `handleLogin()` has comprehensive error handling
   - `handleLogout()` has proper cleanup
   - API helper logs all requests

---

## 🧪 Test 1: Basic Login Persistence

### Steps:
1. Open terminal and start Flask server:
   ```bash
   python app.py
   ```
   ✓ Server should start without errors

2. Open browser to http://127.0.0.1:5000
   ✓ Page loads and shows login form
   ✓ Console is clean (press F12 to open Developer Tools)

3. Register a new account:
   - Username: `testuser123`
   - Password: `password123`
   ✓ Page should load dashboard after registration

4. Check browser console (F12 → Console tab):
   - Look for messages starting with `[Login]`, `[Register]`, `[API]`
   - You should see:
     - `[Register] Attempting registration`
     - `[API] Making request to: /api/register`
     - `[API] Response status: 201`
     - `[Register] Session created`
     - `[showApp] Starting dashboard`
     - `[showApp] Loading categories`

5. Check Flask server logs (terminal):
   - Should show:
     ```
     [Register] Received registration request
     [Register] Username: testuser123
     [Register] Hashing password
     [Register] Inserting user into database
     [Register] User registered with ID: 1
     [Register] Session created with user_id: 1
     [Register] Session permanent: True
     ```

### Expected Result:
✅ Dashboard loads successfully with "Add Expense" form visible

---

## 🧪 Test 2: Page Reload Persistence

### Steps:
1. With dashboard still open, press F5 (refresh page)
   ✓ Page should reload
   ✓ Dashboard should remain visible (not show login)

2. Check browser console:
   - Should see:
     ```
     [checkAuth] Checking authentication status
     [API] Making request to: /api/check-auth
     [API] Response status: 200
     [checkAuth] Auth check response: {authenticated: true, user_id: 1, username: "testuser123"}
     [checkAuth] User is authenticated: testuser123
     [checkAuth] Showing app (auth sections detected)
     [showApp] Starting dashboard
     [showApp] Loading categories
     ```

3. Check Flask server logs:
   - Should show:
     ```
     [CheckAuth] Checking authentication
     [CheckAuth] Session: {'user_id': 1, 'username': 'testuser123', ...}
     [CheckAuth] User ID in session: True
     [CheckAuth] User authenticated - user_id: 1, username: testuser123
     ```

### Expected Result:
✅ Dashboard persists after page reload, login form is NOT shown
✅ You remain logged in with same user

---

## 🧪 Test 3: Tab Close and Reopen

### Steps:
1. With dashboard open, note the session should persist for 7 days
2. Try closing the browser tab (not the entire browser)
3. Reopen the URL http://127.0.0.1:5000

### Expected Result:
✅ Dashboard loads immediately without login
✅ Session cookie preserved by browser

---

## 🧪 Test 4: Server Restart Persistence

### Steps:
1. With dashboard open and logged in, note your session is active
2. Go to terminal and stop Flask server (Ctrl+C)
   ✓ Server stops
3. Wait 2 seconds
4. Restart Flask server:
   ```bash
   python app.py
   ```
5. Refresh the browser page (F5)

### Expected Result:
✅ Dashboard should still be visible (session persists across server restart)
✅ Flask logs should show:
   ```
   [CheckAuth] Checking authentication
   [CheckAuth] Session: {'user_id': 1, 'username': 'testuser123', ...}
   [CheckAuth] User authenticated - user_id: 1, username: testuser123
   ```

**Why this works:**
- Before fix: Secret key changed on every restart, invalidating session cookies
- After fix: Secret key is fixed, so session cookies remain valid

---

## 🧪 Test 5: Login with Existing User

### Steps:
1. Click logout button (should show after login)
   ✓ Dashboard disappears
   ✓ Login form appears

2. Check Flask logs:
   ```
   [Logout] User logging out
   [Logout] Session cleared
   ```

3. Check browser console:
   - Should see `[Logout] Logout successful`

4. Register a second account:
   - Username: `testuser456`
   - Password: `password456`

5. Verify dashboard loads for new user

6. Click logout again

7. Login with original account (testuser123/password123)
   ✓ Dashboard should load
   ✓ Session should be for testuser123

### Expected Result:
✅ Login and logout cycle works correctly
✅ Sessions properly isolated between users

---

## 🧪 Test 6: Session Timeout (Long Running Test)

### Steps:
1. Login with a test account
2. Leave the page open without activity for 7 days (or adjust PERMANENT_SESSION_LIFETIME for testing to 1 minute)
3. Try to perform an action (add expense, view analytics, etc.)

### Expected Result:
✅ After 7 days: Session expires, user is logged out
✅ User redirected to login page
✅ Browser console shows `[checkAuth] User is not authenticated`

---

## 🔍 Troubleshooting

### Problem: Login page still shows after refresh
**Solution:**
1. Open browser DevTools (F12)
2. Go to Application tab → Cookies
3. Verify a cookie named `session` exists with a long random string
4. Check Flask logs for `[CheckAuth]` messages
5. If no session cookie, verify app.secret_key is fixed (not random)

### Problem: Different secret key on restart
**Verify:**
```python
# In app.py line ~36
app.secret_key = 'spendsense-dev-secret-key-2026'  # Should be FIXED string
# NOT: app.secret_key = os.urandom(24)  # This changes every restart
```

### Problem: Browser console shows errors
**Check:**
1. Network tab in DevTools - verify API responses are 200/201
2. Look for CORS errors
3. Verify Flask server is running on http://127.0.0.1:5000
4. Check for JavaScript errors in console (may have syntax issues)

### Problem: Flask logs show "User not authenticated"
**Check:**
1. Session cookie exists in browser
2. app.secret_key matches between restarts
3. SESSION_COOKIE_HTTPONLY is True
4. SESSION_COOKIE_SAMESITE is 'Lax'

---

## 📋 Testing Checklist

Use this checklist to verify all session persistence features:

- [ ] Test 1: Basic Login & Dashboard Load
  - [ ] Registration successful
  - [ ] Dashboard loads after registration
  - [ ] Console shows proper [Register] messages
  - [ ] Flask logs show session created

- [ ] Test 2: Page Reload Persistence
  - [ ] F5 refresh keeps user logged in
  - [ ] Dashboard remains visible
  - [ ] Console shows [checkAuth] authentication check
  - [ ] No login form appears

- [ ] Test 3: Tab Close/Reopen
  - [ ] Tab close doesn't log out
  - [ ] New tab opens with dashboard
  - [ ] Session cookie valid

- [ ] Test 4: Server Restart
  - [ ] Stop and restart Flask
  - [ ] F5 refresh shows dashboard (not login)
  - [ ] Session persists across restarts
  - [ ] Same user_id and username

- [ ] Test 5: Login/Logout Cycle
  - [ ] Logout button works
  - [ ] Session clears on logout
  - [ ] Login with different user works
  - [ ] Users have separate sessions

- [ ] Test 6: Multiple Devices (Optional)
  - [ ] Login on different devices
  - [ ] Each device maintains separate session
  - [ ] Logout on one device doesn't affect others

---

## 🎯 Success Criteria

Session persistence is working correctly when:

1. ✅ User stays logged in after page refresh (F5)
2. ✅ User stays logged in after server restart
3. ✅ Session persists for 7 days without activity
4. ✅ Explicit logout clears session
5. ✅ Multiple users can have simultaneous sessions
6. ✅ Flask logs show proper session creation/validation
7. ✅ Browser DevTools shows persistent session cookie
8. ✅ No JavaScript errors in console

---

## 📝 Session Configuration Summary

**Critical Settings in app.py:**

```python
# Line 36: Fixed secret key (CRITICAL - was random before)
app.secret_key = 'spendsense-dev-secret-key-2026'

# Line 39-42: Session configuration
app.config['SESSION_COOKIE_SECURE'] = False        # http in dev, https in prod
app.config['SESSION_COOKIE_HTTPONLY'] = True       # Prevent JS access
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'      # CSRF protection
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_REFRESH_EACH_REQUEST'] = True

# Line 1230 & 1275: Session marked permanent
session.permanent = True
session['user_id'] = user_id
```

---

## 🚀 Next Steps After Successful Testing

Once all tests pass:

1. **Production Deployment:**
   - Change secret key to use environment variable:
     ```python
     app.secret_key = os.environ.get('SECRET_KEY', os.urandom(24))
     ```
   - Set `SESSION_COOKIE_SECURE = True` (requires HTTPS)

2. **Optional Enhancements:**
   - Add database-backed session store (Flask-Session)
   - Implement "Remember Me" checkbox
   - Add session activity logging

3. **Security Review:**
   - Verify HTTPS is enabled in production
   - Review CORS settings
   - Test with authentication tools

---

## 📞 Support

If session persistence still isn't working:

1. Verify all fixes are applied to app.py (lines 36-42, 1230, 1275)
2. Check Flask logs for [Login], [Register], [CheckAuth] messages
3. Check browser console for errors
4. Verify session cookie exists in DevTools
5. Ensure app.secret_key is the fixed string value

