# 📧 Email Update Feature - Visual Guide

## UI Before & After

### BEFORE
```
┌─ Settings Page ─────────────────────────┐
│                                          │
│ 👤 Profile & Account                    │
│                                          │
│ Username: [ john_doe ]                  │
│                                          │
│ Email: [ (disabled) ]                   │
│ ℹ️ Read-only - contact support to change │
│                                          │
│ Preferred Name: [ John Doe ]            │
│                                          │
│ [Change Password] [Logout All] [Save]   │
│                                          │
└──────────────────────────────────────────┘
```

### AFTER
```
┌─ Settings Page ─────────────────────────┐
│                                          │
│ 👤 Profile & Account                    │
│                                          │
│ Username: [ john_doe ]                  │
│                                          │
│ Email: [ john@example.com ] [Update✎]  │ ← New Button!
│ ℹ️ Securely update your email address    │
│                                          │
│ Preferred Name: [ John Doe ]            │
│                                          │
│ [Change Password] [Logout All] [Save]   │
│                                          │
└──────────────────────────────────────────┘
```

## Modal Dialog

### Update Email Modal
```
╔════════════════════════════════════════╗
║  📧 Update Email Address            ✕  ║
╠════════════════════════════════════════╣
║                                        ║
║  New Email Address                     ║
║  ┌──────────────────────────────────┐  ║
║  │ newemail@example.com             │  ║
║  └──────────────────────────────────┘  ║
║                                        ║
║  Current Password (for verification)   ║
║  ┌──────────────────────────────────┐  ║
║  │ ••••••••                          │  ║
║  └──────────────────────────────────┘  ║
║                                        ║
╠════════════════════════════════════════╣
║              [Cancel] [Update Email]  ║
╚════════════════════════════════════════╝
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    1. Click "Update Email"
                             │
                             ▼
        ┌─────────────────────────────────────┐
        │   Modal Opens (form reset)          │
        │   - New Email Input                 │
        │   - Password Input                  │
        └────────┬────────────────────────────┘
                 │
                 ▼
        2. User enters data
                 │
                 ▼
        ┌─────────────────────────────────────┐
        │ 3. FRONTEND VALIDATION (Client)     │
        │   ✓ Fields not empty                │
        │   ✓ Email format check (regex)      │
        │   ✓ Not same as current email       │
        └────────┬────────────────────────────┘
                 │
                 ├─ Validation fails?
                 │  → Show Error Toast
                 │  → User tries again
                 │
                 └─ Validation OK?
                    │
                    ▼
        ┌─────────────────────────────────────┐
        │ 4. SEND POST REQUEST                │
        │   /api/settings/update-email        │
        │   {                                 │
        │     "new_email": "...",             │
        │     "password": "..."               │
        │   }                                 │
        └────────┬────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────────┐
        │ 5. BACKEND VALIDATION (Server)      │
        │   ✓ User authenticated              │
        │   ✓ Email format valid              │
        │   ✓ Password verification (bcrypt)  │
        │   ✓ Email not already in use        │
        └────────┬────────────────────────────┘
                 │
                 ├─ Validation fails?
                 │  → Return error (400/401/409)
                 │  → Show Error Toast
                 │  → User tries again
                 │
                 └─ Validation OK?
                    │
                    ▼
        ┌─────────────────────────────────────┐
        │ 6. UPDATE DATABASE                  │
        │   UPDATE users                      │
        │   SET email = 'newemail@...'        │
        │   WHERE id = user_id                │
        └────────┬────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────────┐
        │ 7. RETURN SUCCESS (200)             │
        │   {                                 │
        │     "message": "Email updated...",  │
        │     "email": "newemail@..."         │
        │   }                                 │
        └────────┬────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────────┐
        │ 8. UI UPDATES                       │
        │   ✓ Show success toast              │
        │   ✓ Refresh email field             │
        │   ✓ Close modal automatically       │
        └─────────────────────────────────────┘
```

## Validation Flow

### Frontend Validation
```
User Input
    ▼
Is email empty? ─→ YES ─→ Error: "All fields required"
    │                           │
    NO                          ▼
    │                    Show Toast
    ▼                           │
Is password empty? ─→ YES ─→ Error: "All fields required"
    │                           │
    NO                          ▼
    │                    Show Toast
    ▼
Is email format valid? ─→ NO ─→ Error: "Invalid email format"
    │                           │
    YES                         ▼
    │                    Show Toast
    ▼
Is it same as current? ─→ YES ─→ Error: "New email must be different"
    │                           │
    NO                          ▼
    │                    Show Toast
    ▼
SEND TO BACKEND
```

### Backend Validation
```
Receive Request
    ▼
Is email provided? ─→ NO ─→ 400: "Email required"
    │
    YES
    ▼
Is password provided? ─→ NO ─→ 400: "Password required"
    │
    YES
    ▼
Is email format valid? ─→ NO ─→ 400: "Invalid format"
    │
    YES
    ▼
Get user record ─→ NOT FOUND ─→ 404: "User not found"
    │
    FOUND
    ▼
Verify password ─→ WRONG ─→ 401: "Password incorrect"
    │
    CORRECT
    ▼
Check email exists ─→ YES (by other user) ─→ 409: "Email in use"
    │
    NOT IN USE
    ▼
UPDATE DATABASE
    ▼
200: Success Response
```

## Error Messages & Handling

```
┌──────────────────────────────────────────────────────┐
│              ERROR HANDLING MATRIX                    │
├──────────────────────────────┬────────────────────────┤
│ Error Condition              │ User Message           │
├──────────────────────────────┼────────────────────────┤
│ Both fields empty            │ All fields required    │
│ Email empty                  │ All fields required    │
│ Password empty               │ All fields required    │
│                              │                        │
│ Email: "notanemail"          │ Invalid email format   │
│ Email: "test@"               │ Invalid email format   │
│ Email: "@test.com"           │ Invalid email format   │
│                              │                        │
│ Email same as current        │ New email must be      │
│                              │ different              │
│                              │                        │
│ Password wrong               │ Password is incorrect  │
│ Password hash mismatch       │ Password is incorrect  │
│                              │                        │
│ Email used by other user     │ Email already in use   │
│ Duplicate in database        │ Email already in use   │
│                              │                        │
│ Network error                │ Failed to update email │
│ Server error                 │ Failed to update email │
│ Exception                    │ Failed to update email │
└──────────────────────────────┴────────────────────────┘
```

## Success Notification

```
When email update succeeds:

┌────────────────────────────────────┐
│ ✅ Email updated successfully     │ ← Green toast
│    (auto-dismisses in 3 seconds)   │
└────────────────────────────────────┘

AND

Email field updates:
Before: [ john@oldmail.com ] [Update✎]
After:  [ john@newmail.com ] [Update✎]

AND

Modal closes automatically
```

## HTML Structure

```html
<!-- Email field with button -->
<div class="setting-item">
  <label>Email</label>
  <div class="email-input-group">
    <input readonly id="email-input" class="setting-input">
    <button id="update-email-btn" class="btn-secondary">
      Update Email
    </button>
  </div>
  <span class="setting-helper">Securely update your email</span>
</div>

<!-- Modal for email update -->
<div id="email-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Update Email Address</h2>
      <button id="email-modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="modal-form-group">
        <label>New Email Address</label>
        <input type="email" id="new-email-input" class="form-control">
      </div>
      <div class="modal-form-group">
        <label>Current Password</label>
        <input type="password" id="email-password-input" class="form-control">
      </div>
    </div>
    <div class="modal-footer">
      <button id="email-modal-cancel" class="btn-secondary">Cancel</button>
      <button id="email-update-confirm" class="btn-primary">Update Email</button>
    </div>
  </div>
</div>

<!-- Modal overlay -->
<div id="modal-overlay" class="modal-overlay"></div>
```

## CSS Layout

```css
.email-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.email-input-group .setting-input {
  flex: 1;  /* Takes remaining space */
}

.email-input-group .btn-secondary {
  white-space: nowrap;  /* Button label stays on one line */
}

/* Result: [Email field grows] [Button fixed width] */
```

## API Contract

```
REQUEST:
┌──────────────────────────────────────┐
│ POST /api/settings/update-email      │
├──────────────────────────────────────┤
│ Headers:                             │
│   Content-Type: application/json     │
│   (Session cookie included auto)     │
├──────────────────────────────────────┤
│ Body:                                │
│ {                                    │
│   "new_email": "new@example.com",   │
│   "password": "userPassword"         │
│ }                                    │
└──────────────────────────────────────┘

RESPONSE (Success - 200):
┌──────────────────────────────────────┐
│ {                                    │
│   "message": "Email updated...",     │
│   "email": "new@example.com"         │
│ }                                    │
└──────────────────────────────────────┘

RESPONSE (Error - Various):
┌──────────────────────────────────────┐
│ {                                    │
│   "error": "Email already in use"    │
│ }                                    │
│ Status: 400, 401, 404, 409, or 500  │
└──────────────────────────────────────┘
```

## Feature Checklist

```
✅ Email field visible in Settings
✅ Email field is readonly (can't edit directly)
✅ "Update Email" button appears next to field
✅ Clicking button opens modal
✅ Modal has new email input
✅ Modal has password input
✅ Cancel button closes modal
✅ X button closes modal
✅ Overlay click closes modal
✅ Empty form shows error
✅ Invalid email shows error
✅ Same email shows error
✅ Wrong password shows error
✅ Duplicate email shows error
✅ Success shows toast notification
✅ Email field refreshes on success
✅ Modal closes on success
✅ Password verified securely (bcrypt)
✅ Email uniqueness checked
✅ User session verified (@login_required)
✅ Proper HTTP status codes returned
```

---

**This feature is now ready for production use!** 🚀
