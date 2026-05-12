# Settings Page - Quick Reference

## Feature Summary

The Settings page (3rd main navigation page) provides users with complete control over their SpendSense experience through three main sections:

### 1. Profile & Account
- **Username**: Display only (cannot be changed)
- **Email**: Read-only informational
- **Preferred Name**: Editable custom display name
- **Actions**: Change Password, Logout All Devices

### 2. Currency & Localization
- **Currency**: INR (₹), USD ($), EUR (€), GBP (£)
- **Date Format**: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- **Number Format**: Indian (1,00,000), Western (100,000)

### 3. Notifications & Alerts
- **Budget Alert**: Notify at 80% of monthly budget
- **Spike Alert**: Alert on unusually high daily expenses
- **Weekly Summary**: End-of-week expense report
- **Monthly Report**: End-of-month summary

## Quick Actions

### Change Settings
1. Navigate to Settings page (click Settings link)
2. Modify any field
3. Change automatically saved (auto-save)
4. See green success toast

### Change Password
1. Click "Change Password" button
2. Enter current password
3. Enter new password (minimum 6 characters)
4. Confirm new password
5. Click "Change Password" in modal
6. Success toast appears

### Logout from All Devices
1. Click "Logout from All Devices" button
2. Confirm action
3. Redirected to login page

## API Endpoints Reference

```
GET  /api/settings/profile           → Fetch user profile
POST /api/settings/profile           → Update profile
GET  /api/settings/localization      → Fetch regional settings
POST /api/settings/localization      → Update regional settings
GET  /api/settings/notifications     → Fetch alert preferences
POST /api/settings/notifications     → Update alert preferences
POST /api/settings/change-password   → Change password
POST /api/settings/logout-all        → Logout from all devices
```

## Response Examples

### GET /api/settings/profile
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "preferred_name": "John"
}
```

### POST /api/settings/localization
```json
Request:
{
  "currency": "USD",
  "date_format": "MM/DD/YYYY",
  "number_format": "en-US"
}

Response:
{
  "message": "Localization settings updated",
  "currency": "USD",
  "date_format": "MM/DD/YYYY",
  "number_format": "en-US"
}
```

### GET /api/settings/notifications
```json
{
  "budget_alert": true,
  "spike_alert": true,
  "weekly_summary": false,
  "monthly_report": true
}
```

## Database Schema

```sql
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN preferred_name TEXT;
ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'INR';
ALTER TABLE users ADD COLUMN date_format TEXT DEFAULT 'DD/MM/YYYY';
ALTER TABLE users ADD COLUMN number_format TEXT DEFAULT 'en-IN';
ALTER TABLE users ADD COLUMN budget_alert INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN spike_alert INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN weekly_summary INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN monthly_report INTEGER DEFAULT 1;
```

## File Structure

```
Pro1/
├── app.py (450+ new lines)
│   ├── Updated init_db() with settings columns
│   ├── @app.route('/settings') → Render page
│   └── 6 API route pairs for settings CRUD
│
├── templates/
│   ├── settings.html (280+ lines)
│   │   ├── Profile card with form
│   │   ├── Localization card with dropdowns
│   │   ├── Notifications card with toggles
│   │   ├── Password modal
│   │   └── Toast notification container
│   │
│   ├── index.html (updated)
│   │   └── Navigation link to /settings
│   │
│   └── analytics.html (updated)
│       └── Navigation link to /settings
│
└── static/
    ├── js/
    │   ├── settings.js (320+ lines)
    │   │   ├── initSettings()
    │   │   ├── loadSettings()
    │   │   ├── saveProfile()
    │   │   ├── saveLocalization()
    │   │   ├── saveNotifications()
    │   │   ├── confirmPasswordChange()
    │   │   ├── logoutAll()
    │   │   └── showToast()
    │   │
    │   └── app.js (modified)
    │       └── Theme toggle shared
    │
    └── css/
        └── style.css (380+ new lines)
            ├── .settings-content
            ├── .settings-card
            ├── .setting-item
            ├── .toggle-input (custom toggle switch)
            ├── .modal (password change dialog)
            └── .toast-notification
```

## Key Features

✅ **Auto-Save**: Changes saved immediately on input change
✅ **Real-time Feedback**: Toast notifications for success/error
✅ **Password Protection**: Current password verification required
✅ **Responsive Design**: Works on mobile, tablet, desktop
✅ **Dark Mode**: Settings page respects theme preference
✅ **Session Management**: Logout all devices clears all sessions
✅ **Input Validation**: Client and server-side validation
✅ **Database Persistence**: Settings stored in SQLite
✅ **Accessibility**: Semantic HTML, proper form labels
✅ **Security**: CSRF protection, password hashing with bcrypt

## User Experience Flow

```
1. User logs in → Dashboard
2. Clicks "Settings" in navigation
3. Settings page loads with current values
4. User modifies any field
5. Auto-save triggers
6. API POST request sent
7. Server updates database
8. Toast confirms success
9. User can navigate to other pages
10. Settings persist across sessions
```

## Testing Highlights

**20 Comprehensive Tests Included:**
- Navigation and page load
- Settings loading and persistence
- Profile name updates
- Currency changes
- Date/number format changes
- Toggle switches
- Password change (valid and invalid)
- Modal dialog functionality
- Error handling
- Theme toggle
- Mobile responsiveness
- Database persistence
- Multiple sessions
- Real-time auto-save

All tests detailed in `SETTINGS_TESTING.md`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Settings not loading | Verify API endpoints return 200, check session auth |
| Changes not saving | Check Network tab for failed requests, verify DB writable |
| Modal not closing | Clear browser cache, hard refresh (Ctrl+Shift+R) |
| Toast not appearing | Check browser console for JS errors |
| Theme not applying | Verify CSS variables in :root, localStorage enabled |
| Password change fails | Ensure current password correct, new password ≥6 chars |

## Integration Notes

### With Dashboard
- Currency affects expense display
- Number format affects amounts shown
- Applied on next page load

### With Analytics
- Date format used in date displays
- Currency shown in charts
- Localization applied to reports

### With Exports
- Currency symbol in Excel/PDF exports
- Date format in exported files
- Number format in calculations

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Settings page load: < 1 second
- API response time: < 100ms (local dev)
- Auto-save debounced (no duplicate requests)
- Database queries optimized (user_id indexed)

## Security

- ✅ Authentication required (@login_required)
- ✅ Password verified with bcrypt
- ✅ Parameterized SQL queries (no injection)
- ✅ Input validation on all endpoints
- ✅ Session-based authorization
- ✅ No sensitive data in logs
- ✅ HTTPS recommended for production

## Future Enhancements

- [ ] Email verification for notifications
- [ ] Two-factor authentication
- [ ] API key management
- [ ] Data export (JSON/CSV)
- [ ] Account deletion
- [ ] Login history
- [ ] Connected apps
- [ ] Push notifications
- [ ] Recurring expense settings
- [ ] Budget templates

## Support Resources

- `SETTINGS_IMPLEMENTATION.md` - Complete technical documentation
- `SETTINGS_TESTING.md` - Detailed testing guide with 20+ tests
- `app.py` - Backend implementation
- `templates/settings.html` - Frontend structure
- `static/js/settings.js` - Client-side logic
- `static/css/style.css` - Styling (lines 2246+)

## Quick Links

- **Settings Page**: http://localhost:5000/settings
- **API Base**: http://localhost:5000/api/settings/
- **Database**: `expenses.db` (SQLite3)
- **Server Logs**: Terminal output
- **Browser Console**: F12 → Console tab
