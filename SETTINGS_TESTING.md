# Settings Page Testing & Verification Guide

## Quick Start Testing

### 1. Launch the Application
```bash
cd c:\Users\kruti\OneDrive\Desktop\Pro1
.\.venv\Scripts\python.exe app.py
```
- Application runs on http://localhost:5000
- Debug mode enabled
- Database initialized with users table schema

### 2. Create Test Account
1. Open http://localhost:5000
2. Click "Register"
3. Enter:
   - Username: `testuser`
   - Password: `testpass123`
4. Click "Register"
5. Should see "Registration successful"

### 3. Login
1. Username: `testuser`
2. Password: `testpass123`
3. Click "Login"
4. Should redirect to dashboard

## Feature Testing

### Test 1: Navigation to Settings
**Steps:**
1. After login, look at main navigation
2. Click "Settings" link (between "Analytics" and other links)

**Expected Results:**
- ✅ Settings page loads at `/settings`
- ✅ Header shows navigation with Settings highlighted
- ✅ Three card sections visible:
  - Profile & Account
  - Currency & Localization
  - Notifications & Alerts
- ✅ Settings appear loaded (no "Loading..." message)

### Test 2: Load Current Settings
**Steps:**
1. Open Developer Console (F12 → Network tab)
2. Navigate to Settings page
3. Watch Network tab for API calls

**Expected Results:**
- ✅ Three API GET requests made:
  - `/api/settings/profile` (200 OK)
  - `/api/settings/localization` (200 OK)
  - `/api/settings/notifications` (200 OK)
- ✅ All requests complete within 500ms
- ✅ Form fields populate with values:
  - Preferred Name: (empty initially)
  - Currency: "INR"
  - Date Format: "DD/MM/YYYY"
  - Number Format: "en-IN"
  - Budget Alert: checked (enabled)
  - Spike Alert: checked (enabled)
  - Weekly Summary: unchecked (disabled)
  - Monthly Report: checked (enabled)

### Test 3: Update Preferred Name
**Steps:**
1. In Profile & Account card
2. Find "Preferred Name" field
3. Clear field if populated
4. Type: `John Doe`
5. Click away or press Tab

**Expected Results:**
- ✅ API POST to `/api/settings/profile` (watch Network tab)
- ✅ Toast notification appears: "Profile saved successfully"
- ✅ Toast appears for 3 seconds then disappears
- ✅ Preferred name persists on page refresh

**Verification:**
```javascript
// Open Console and run:
fetch('/api/settings/profile').then(r => r.json()).then(d => console.log(d))
// Should show: {username, email, preferred_name: "John Doe"}
```

### Test 4: Change Currency
**Steps:**
1. In Currency & Localization card
2. Click Currency dropdown (currently shows "₹ INR")
3. Select "$ USD"
4. Wait for save

**Expected Results:**
- ✅ API POST to `/api/settings/localization` (Network tab)
- ✅ Toast shows: "Localization settings saved"
- ✅ Currency dropdown remains at "$ USD"
- ✅ Setting persists on page refresh

### Test 5: Change Date Format
**Steps:**
1. In Currency & Localization card
2. Click Date Format dropdown (currently "DD/MM/YYYY")
3. Select "MM/DD/YYYY"
4. Wait for save

**Expected Results:**
- ✅ API POST to `/api/settings/localization`
- ✅ Toast confirms save
- ✅ Selection persists on refresh

### Test 6: Toggle Budget Alert
**Steps:**
1. In Notifications & Alerts card
2. Find "Budget Alert (80% of budget)" toggle
3. Click toggle switch to turn it OFF
4. Wait for save

**Expected Results:**
- ✅ Toggle visually changes state
- ✅ API POST to `/api/settings/notifications`
- ✅ Toast shows: "Notification preferences saved"
- ✅ Toggle stays OFF on page refresh

**Verification:**
```javascript
fetch('/api/settings/notifications').then(r => r.json()).then(d => {
  console.log('Budget Alert:', d.budget_alert) // Should be false
})
```

### Test 7: Toggle Multiple Notifications
**Steps:**
1. Turn OFF: Budget Alert, Spike Alert
2. Turn ON: Weekly Summary
3. Leave Monthly Report ON

**Expected Results:**
- ✅ API POST after each toggle
- ✅ All toggles show correct state
- ✅ Refresh page - toggles persist

### Test 8: Password Change Modal
**Steps:**
1. Click "Change Password" button in Profile card
2. Modal dialog appears
3. Modal shows 3 input fields:
   - Current Password
   - New Password
   - Confirm Password

**Expected Results:**
- ✅ Modal displays centered on screen
- ✅ Modal has dark overlay background
- ✅ Modal has "Cancel" and "Change Password" buttons
- ✅ Modal has close button (X) in top right
- ✅ Can close modal with:
  - X button
  - Cancel button
  - Clicking outside modal (overlay)

### Test 9: Change Password - Valid Input
**Steps:**
1. Open password change modal
2. Enter:
   - Current Password: `testpass123`
   - New Password: `newpass456`
   - Confirm Password: `newpass456`
3. Click "Change Password" button

**Expected Results:**
- ✅ API POST to `/api/settings/change-password` (Network tab)
- ✅ Toast shows: "Password changed successfully"
- ✅ Modal automatically closes
- ✅ Can verify by logging out and logging back in with new password

**Verification:**
1. Click Logout
2. Register/login with new password: `newpass456`
3. Should succeed

### Test 10: Change Password - Wrong Current Password
**Steps:**
1. Open password change modal
2. Enter:
   - Current Password: `wrongpass`
   - New Password: `test123`
   - Confirm Password: `test123`
3. Click "Change Password"

**Expected Results:**
- ✅ API POST sent
- ✅ Toast shows: "Current password is incorrect"
- ✅ Modal stays open
- ✅ Can retry

### Test 11: Change Password - Mismatched Passwords
**Steps:**
1. Open password change modal
2. Enter:
   - Current Password: `testpass123`
   - New Password: `newpass1`
   - Confirm Password: `newpass2` (different!)
3. Click "Change Password"

**Expected Results:**
- ✅ Toast shows: "New passwords do not match"
- ✅ API not called (validation happens client-side)
- ✅ Modal stays open

### Test 12: Change Password - Too Short
**Steps:**
1. Open password change modal
2. Enter:
   - Current Password: `testpass123`
   - New Password: `abc`
   - Confirm Password: `abc`
3. Click "Change Password"

**Expected Results:**
- ✅ Toast shows: "Password must be at least 6 characters"
- ✅ Modal stays open
- ✅ No API call made

### Test 13: Logout All Devices
**Steps:**
1. Click "Logout from All Devices" button
2. Confirmation dialog appears
3. Click "OK" (or "Yes")

**Expected Results:**
- ✅ Toast shows: "Logged out from all devices"
- ✅ Page redirects to login page after 1 second
- ✅ Session cleared
- ✅ Cannot navigate back to protected pages

### Test 14: Theme Toggle
**Steps:**
1. On Settings page, click theme toggle button (sun/moon icon) in header
2. Page changes to dark mode
3. Click theme toggle again

**Expected Results:**
- ✅ Page toggles between light and dark modes
- ✅ Settings page styling updates immediately:
  - Text color changes
  - Background colors change
  - Cards are visible and readable
  - Form inputs visible
- ✅ Theme persists across page refreshes
- ✅ Theme preference applied on all pages (Dashboard, Analytics, Settings)

### Test 15: Responsive Design - Mobile
**Steps:**
1. Open Developer Tools (F12)
2. Click "Device Toolbar" or use Ctrl+Shift+M
3. Select iPhone 12 / 375px width
4. Navigate to Settings page
5. Scroll through all sections

**Expected Results:**
- ✅ Layout adapts to narrow width
- ✅ Single column layout (not cramped)
- ✅ Cards stack vertically
- ✅ Form fields full width
- ✅ Buttons large enough to touch (48px min)
- ✅ Modal dialog readable on mobile
- ✅ Toast notifications visible
- ✅ All text readable (no horizontal scroll needed)

### Test 16: Form Validation
**Steps:**
1. Go to Profile section
2. Leave Preferred Name empty
3. Try to save

**Expected Results:**
- ✅ Form allows empty preferred name
- ✅ Toast confirms save
- ✅ Empty string stored in database

**Note:** Username cannot be changed via settings (read-only for security)

### Test 17: Real-time Auto-Save
**Steps:**
1. Change Currency to "EUR"
2. Quickly scroll to another field
3. Check Network tab

**Expected Results:**
- ✅ API call made after change
- ✅ Toast notification appears
- ✅ No "Save" button needed
- ✅ Changes persist immediately

### Test 18: Multiple Sessions
**Steps:**
1. Open Settings page in Browser A
2. Open same site in incognito (Browser B)
3. Login with same account in Browser B
4. Change Currency to GBP in Browser B
5. Refresh Browser A (without closing)

**Expected Results:**
- ✅ Browser A shows updated currency (GBP)
- ✅ Other user's changes visible on refresh
- ✅ No conflicts between sessions

### Test 19: Error Handling - Server Error
**Steps:**
1. Start an HTTP proxy or use browser DevTools to intercept requests
2. Block `/api/settings/notifications` response
3. Toggle a notification preference
4. Watch for error handling

**Expected Results:**
- ✅ Toast shows error message
- ✅ User can retry
- ✅ No broken UI
- ✅ Console has error details (if needed for debugging)

### Test 20: Database Persistence
**Steps:**
1. Login and change settings:
   - Preferred Name: "Jane Smith"
   - Currency: EUR
   - Budget Alert: OFF
2. Logout
3. Close app
4. Restart app: `.venv\Scripts\python.exe app.py`
5. Login with same credentials
6. Navigate to Settings

**Expected Results:**
- ✅ All settings loaded correctly
- ✅ Preferred Name: "Jane Smith"
- ✅ Currency: EUR
- ✅ Budget Alert: OFF
- ✅ Data persisted in SQLite database

**Database Verification:**
```python
import sqlite3
conn = sqlite3.connect('expenses.db')
cursor = conn.cursor()
cursor.execute('SELECT preferred_name, currency, budget_alert FROM users WHERE username = ?', ('testuser',))
row = cursor.fetchone()
print(f"Preferred: {row[0]}, Currency: {row[1]}, Budget Alert: {row[2]}")
# Should show: Preferred: Jane Smith, Currency: EUR, Budget Alert: 0
```

## Browser Console Testing

### Test API Endpoints Directly

```javascript
// Test Profile GET
fetch('/api/settings/profile')
  .then(r => r.json())
  .then(d => console.log('Profile:', d))

// Test Profile POST
fetch('/api/settings/profile', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username: 'testuser', preferred_name: 'Test Name'})
})
  .then(r => r.json())
  .then(d => console.log('Updated:', d))

// Test Localization GET
fetch('/api/settings/localization')
  .then(r => r.json())
  .then(d => console.log('Localization:', d))

// Test Notifications GET
fetch('/api/settings/notifications')
  .then(r => r.json())
  .then(d => console.log('Notifications:', d))

// Test Change Password
fetch('/api/settings/change-password', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    current_password: 'testpass123',
    new_password: 'newpass456'
  })
})
  .then(r => r.json())
  .then(d => console.log(d))
```

### Test JavaScript Functions

```javascript
// Test toast notification
showToast('Test message', 'success')
showToast('Error message', 'error')

// Test theme toggle
toggleTheme()

// Verify loaded settings
console.log('Username:', document.getElementById('username-display').textContent)
console.log('Currency:', document.getElementById('currency-select').value)
console.log('Budget Alert:', document.getElementById('budget-alert-toggle').checked)
```

## Network Request Verification

### Check Request Format
Open DevTools → Network tab → Click on API request → Request tab

**Expected for POST /api/settings/profile:**
```
Headers:
  Content-Type: application/json

Body:
{
  "username": "testuser",
  "preferred_name": "Test Name"
}

Response (200):
{
  "message": "Profile updated successfully",
  "username": "testuser",
  "preferred_name": "Test Name"
}
```

## Known Limitations & Workarounds

### Email is Read-Only
- Email cannot be changed via Settings page
- Would require email verification flow
- Can be added in future enhancement

### Username Cannot Be Changed
- Security feature (username is unique identifier)
- Intended behavior (prevents account takeover)

### Theme Not Shared Across Tabs
- Each tab has its own localStorage
- Click theme toggle in each tab individually
- Limitation of localStorage (not shared across browser sessions)

### Password Change Confirmation
- No confirmation email sent
- Future enhancement: send security alert email

## Performance Benchmarks

### Expected Response Times
- Settings page load: < 1 second
- Each API call: < 100ms (local development)
- Toast animation: 3 seconds
- Modal open/close: < 100ms

### Expected Network Activity
- Initial settings load: 3 requests (parallel)
- Save operation: 1 POST request
- Password change: 1 POST request
- Logout all: 1 POST request

## Debugging Tips

### Settings Not Loading
1. Check DevTools Console for errors
2. Verify in Network tab:
   - API returns 200 status
   - Response body contains expected data
3. Check if user is logged in: `/api/check-auth`
4. Verify database has user_settings columns

### Settings Not Saving
1. Check Network tab - POST request completing?
2. Check response status (200 = success)
3. Check server logs for errors
4. Verify database write permissions

### CSS Not Applied
1. Hard refresh page (Ctrl+Shift+R)
2. Clear browser cache
3. Check CSS file loads in Network tab
4. Verify no CSS conflicts in DevTools

### JavaScript Errors
1. Check Console tab for errors
2. Check Network tab for 404s on script files
3. Verify settings.js loads correctly
4. Look for syntax errors in code

## Regression Testing Checklist

After any changes, verify:
- [ ] Settings page loads
- [ ] All four API endpoints return data
- [ ] Can update preferred name
- [ ] Can change currency
- [ ] Can toggle all notifications
- [ ] Can change password
- [ ] Can logout all devices
- [ ] Theme toggle works
- [ ] Mobile responsive works
- [ ] Database persistence works
- [ ] All toasts appear
- [ ] Modal works for password change
- [ ] No console errors

## Files to Review

- `app.py` - Lines 1-100 (database schema), Lines 1110-1270 (API routes)
- `templates/settings.html` - Complete settings page
- `static/js/settings.js` - Client-side logic
- `static/css/style.css` - Lines 2246+ (Settings styling)

## Success Criteria

✅ All 20 tests pass
✅ No console errors
✅ No network errors (all 200/201 status)
✅ Settings persist across sessions
✅ Mobile design works
✅ Password change works
✅ All toasts appear
✅ Theme toggle works
✅ Logout all devices works

## Next Steps

1. Run through all 20 tests
2. Document any failures
3. Review JavaScript console for warnings
4. Test in different browsers
5. Test on different devices (phone, tablet)
6. Performance test with many expenses
7. Consider additional settings (budgets, recurring, etc.)
