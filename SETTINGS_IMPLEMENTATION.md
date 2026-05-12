# Settings Page Implementation Guide

## Overview

The Settings page is the third main navigation page in SpendSense, allowing users to manage their profile, preferences, and notification settings. This document outlines the complete implementation details.

## Architecture

### Frontend Components

#### HTML Template (`templates/settings.html`)
- Complete settings page layout with three main sections
- Responsive design with mobile support
- Modal dialog for password change functionality
- Toast notification system for user feedback

**Key Sections:**
1. **Profile & Account Card** - User profile information
2. **Currency & Localization Card** - Regional preferences
3. **Notifications & Alerts Card** - Alert preferences

#### JavaScript (`static/js/settings.js`)
Handles all client-side functionality:
- Settings initialization and loading
- Auto-save on input changes
- Password change modal management
- Toast notifications
- Theme toggle (dark/light mode)
- Logout functionality

**Key Functions:**
```javascript
initSettings()           // Initialize page on load
loadSettings()          // Fetch current settings from server
setupEventListeners()   // Attach event handlers
saveProfile()           // Save profile changes
saveLocalization()      // Save localization preferences
saveNotifications()     // Save notification preferences
openPasswordModal()     // Show password change dialog
confirmPasswordChange() // Process password change
logoutAll()            // Logout from all devices
```

#### CSS Styling (`static/css/style.css`)
Lines 2246+ contain all Settings page styles:
- `.settings-content` - Main container
- `.settings-card` - Individual setting cards
- `.setting-item` - Individual setting rows
- `.toggle-input` - Custom toggle switch component
- `.modal` - Password change modal
- `.toast-notification` - Success/error messages

### Backend Components

#### Database Schema (`app.py`)
Users table extended with new columns:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
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
```

#### API Routes

**Route: `/settings`**
- Method: GET
- Auth: Required (@login_required)
- Purpose: Render settings page template
- Response: HTML template

**Route: `/api/settings/profile`**
- Method: GET
  - Returns: `{username, email, preferred_name}`
  - Status: 200 or 404
- Method: POST
  - Body: `{username, preferred_name}`
  - Returns: `{message, username, preferred_name}`
  - Status: 200, 400, or 500

**Route: `/api/settings/localization`**
- Method: GET
  - Returns: `{currency, date_format, number_format}`
  - Status: 200 or 404
- Method: POST
  - Body: `{currency, date_format, number_format}`
  - Returns: `{message, currency, date_format, number_format}`
  - Status: 200, 400, or 500

**Route: `/api/settings/notifications`**
- Method: GET
  - Returns: `{budget_alert, spike_alert, weekly_summary, monthly_report}` (booleans)
  - Status: 200 or 404
- Method: POST
  - Body: `{budget_alert, spike_alert, weekly_summary, monthly_report}` (booleans)
  - Returns: Same format
  - Status: 200, 400, or 500

**Route: `/api/settings/change-password`**
- Method: POST
- Auth: Required (@login_required)
- Body: `{current_password, new_password}`
- Returns: `{message}` or `{error}`
- Status: 200, 400, 401, or 500
- Validation:
  - Current password must be correct
  - New password must be ≥6 characters
  - Both fields required

**Route: `/api/settings/logout-all`**
- Method: POST
- Auth: Required (@login_required)
- Purpose: Clear all sessions for the user
- Returns: `{message}`
- Status: 200

## User Workflow

### 1. Accessing Settings
1. User clicks "Settings" in main navigation
2. Page loads current settings from server
3. `loadSettings()` makes 3 parallel API calls
4. Form fields populate with current values

### 2. Profile Management
**Fields:**
- Username (read-only display, not editable via form)
- Email (read-only, informational)
- Preferred Name (editable)

**Actions:**
- User updates preferred name
- Input change triggers auto-save
- API POST to `/api/settings/profile`
- Toast notification shows success/error

### 3. Localization Settings
**Fields:**
- Currency: INR, USD, EUR, GBP
- Date Format: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- Number Format: Indian (1,00,000), Western (100,000)

**Actions:**
- User changes any dropdown
- Change event triggers save
- API POST to `/api/settings/localization`
- Applied on next dashboard load

### 4. Notification Preferences
**Toggles:**
- Budget Alert: Notify at 80% of budget
- Spike Alert: Unusually high daily spend
- Weekly Summary: End-of-week expense report
- Monthly Report: End-of-month summary

**Actions:**
- User toggles switch on/off
- Change event triggers save
- API POST to `/api/settings/notifications`
- Preferences stored immediately

### 5. Password Change
**Process:**
1. User clicks "Change Password" button
2. Modal dialog appears
3. User enters:
   - Current password
   - New password (≥6 characters)
   - Confirm new password
4. System validates:
   - Current password is correct
   - New and confirm passwords match
   - New password meets length requirement
5. API POST to `/api/settings/change-password`
6. Toast confirms success or shows error
7. Modal closes on success

### 6. Logout All Devices
**Process:**
1. User clicks "Logout from All Devices"
2. Confirmation dialog appears
3. User confirms action
4. API POST to `/api/settings/logout-all`
5. Session cleared
6. User redirected to login page

## Frontend Data Flow

```
settings.html
    ↓
initSettings()
    ↓
loadSettings()
    ├─ GET /api/settings/profile
    ├─ GET /api/settings/localization
    └─ GET /api/settings/notifications
    ↓
[Form populated with current values]
    ↓
setupEventListeners()
    ├─ Input change → saveProfile()
    ├─ Select change → saveLocalization()
    ├─ Toggle change → saveNotifications()
    ├─ Password button → openPasswordModal()
    └─ Theme toggle → toggleTheme()
    ↓
[API POST with new values]
    ↓
showToast() [Success/Error]
```

## Backend Data Flow

```
POST /api/settings/profile
    ↓
Get user_id from session
    ↓
Validate input
    ↓
UPDATE users SET preferred_name = ?
    ↓
Return JSON response
```

## Integration Points

### With Dashboard
- Saved currency setting affects expense display
- Date format affects date displays
- Number format affects amount formatting

### With Analytics
- Currency used in chart labels
- Date format in period selection
- Localization settings applied to reports

### Authentication
- All settings endpoints require @login_required decorator
- Session user_id used to identify user
- Password change uses bcrypt validation

## Error Handling

**Frontend:**
- Try/catch on API calls
- Toast notifications for errors
- User-friendly error messages
- Form field validation

**Backend:**
- Input validation on all endpoints
- Password verification with bcrypt
- Database rollback on errors
- Proper HTTP status codes:
  - 200: Success
  - 400: Bad request (validation error)
  - 401: Unauthorized (auth required, wrong password)
  - 404: User not found
  - 500: Server error

## Theme Integration

Settings page inherits dark/light mode from main theme:
- All CSS uses `:root` variables
- Theme toggle stored in localStorage
- Applied on page initialization
- Settings page respects user's theme preference

## Responsive Design

**Mobile Optimization:**
- Media query at max-width: 768px
- Single column layout on mobile
- Touch-friendly button sizes (48px min)
- Modal adapts to screen size
- Toast positioned for mobile visibility

## Security Considerations

1. **Password Changes:**
   - Current password verified with bcrypt
   - New password hashed before storage
   - No password in request logs
   - HTTPS recommended in production

2. **Session Management:**
   - Logout all devices clears all sessions
   - Session-based authentication
   - User ID from session (not request)

3. **Input Validation:**
   - All inputs validated on server
   - SQL injection prevented with parameterized queries
   - XSS prevented with input sanitization

## Testing Checklist

- [ ] Load settings page after login
- [ ] All fields populate with current values
- [ ] Update preferred name - saves successfully
- [ ] Change currency - selection persists
- [ ] Toggle budget alert on/off - saves
- [ ] Change password with correct current password
- [ ] Try change password with wrong current password - fails
- [ ] Try password < 6 chars - fails
- [ ] Logout all devices - redirects to login
- [ ] Dark mode toggle works
- [ ] Mobile responsive layout works
- [ ] All toast notifications appear
- [ ] Modal dialog opens/closes properly

## Future Enhancements

1. **Email Verification:** Verify email before using for notifications
2. **Two-Factor Authentication:** Add 2FA setup
3. **API Keys:** Generate and manage API keys
4. **Data Export:** Export user data as JSON/CSV
5. **Account Deletion:** Option to delete account
6. **Login History:** Show recent login locations/devices
7. **Connected Apps:** Manage third-party integrations
8. **Notification Channels:** Email, SMS, push notifications
9. **Recurring Expenses:** Settings for recurring expense management
10. **Budget Templates:** Save and reuse budget configurations

## Troubleshooting

### Settings not loading
- Check browser console for errors
- Verify API endpoints are accessible
- Check user authentication status
- Verify database has users table with new columns

### Changes not saving
- Check network tab for failed API requests
- Verify session is valid
- Check server logs for errors
- Ensure database is writable

### Modal not closing
- Check browser console for JavaScript errors
- Verify modal-overlay and password-modal IDs exist
- Check CSS display properties

### Theme not toggling
- Verify localStorage is enabled
- Check CSS variables in :root
- Verify data-theme attribute updates

## Files Modified

- `app.py` - Added 450+ lines (settings routes, database schema)
- `templates/settings.html` - Created (280+ lines)
- `static/js/settings.js` - Created (320+ lines)
- `static/css/style.css` - Added 380+ lines (settings styling)
- `templates/index.html` - Updated navigation
- `templates/analytics.html` - Updated navigation

## Performance Considerations

- Settings loaded with Promise.all() for parallel requests
- Auto-save debounced to prevent excessive API calls
- Toast notifications auto-dismiss after 3 seconds
- Theme toggle applies instantly (no page reload)
- Database queries use indexed columns (user_id)

## Accessibility

- Form labels associated with inputs (for attribute)
- Toggle switches with proper ARIA attributes
- Modal dialog with focus management
- Keyboard navigation support
- Color contrast meets WCAG standards
- Touch targets minimum 48px on mobile

## Documentation

Complete implementation documented in:
- This file (SETTINGS_IMPLEMENTATION.md)
- Code comments in settings.js
- CSS comments for styling sections
- HTML semantic structure in settings.html
