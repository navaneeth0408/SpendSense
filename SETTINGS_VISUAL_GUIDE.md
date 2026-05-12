# 🎨 SpendSense Settings Expansion - Visual Guide

## Settings Page Layout (Before & After)

### BEFORE (4 sections)
```
┌─────────────────────────────┐
│     SpendSense Settings     │
├─────────────────────────────┤
│                             │
│  👤 Profile & Account       │
│  ├─ Username                │
│  ├─ Email (Update)          │
│  └─ Preferred Name          │
│                             │
│  🌐 Currency & Localization │
│  ├─ Default Currency        │
│  ├─ Date Format             │
│  └─ Number Format           │
│                             │
│  🔔 Notifications & Alerts  │
│  ├─ Budget Alert            │
│  ├─ Spike Alert             │
│  ├─ Weekly Summary          │
│  └─ Monthly Report          │
│                             │
└─────────────────────────────┘
```

### AFTER (8 sections - Full Control Panel)
```
┌──────────────────────────────────┐
│    SpendSense Settings Panel     │
├──────────────────────────────────┤
│                                  │
│  👤 Profile & Account            │
│  ├─ Username                     │
│  ├─ Email (Update)               │
│  └─ Preferred Name               │
│                                  │
│  🌐 Currency & Localization      │
│  ├─ Default Currency             │
│  ├─ Date Format                  │
│  └─ Number Format                │
│                                  │
│  🔔 Notifications & Alerts       │
│  ├─ Budget Alert                 │
│  ├─ Spike Alert                  │
│  ├─ Weekly Summary               │
│  └─ Monthly Report               │
│                                  │
│  📂 Manage Categories ✨ NEW     │
│  ├─ Custom Categories List       │
│  ├─ Color Picker                 │
│  ├─ Add/Edit/Delete Cats         │
│  └─ Predefined Categories        │
│                                  │
│  📊 Data & Export ✨ NEW         │
│  ├─ Export to Excel              │
│  ├─ Download PDF Report          │
│  ├─ Backup Data (JSON)           │
│  └─ Restore Data (Upload)        │
│                                  │
│  🔒 Privacy & Security ✨ NEW    │
│  ├─ Require Login on App Open    │
│  ├─ Auto-Logout After 30 min     │
│  ├─ Hide Amounts (Privacy Mode)  │
│  └─ Lock Analytics Page          │
│                                  │
│  ℹ️  About SpendSense ✨ NEW     │
│  ├─ App Name: SpendSense         │
│  ├─ Version: 2.0.0               │
│  ├─ Developer: SpendSense Team   │
│  ├─ Support Email                │
│  ├─ Privacy Policy Link          │
│  └─ Terms of Service Link        │
│                                  │
└──────────────────────────────────┘
```

---

## New Section: Categories Management

### UI Layout
```
╔════════════════════════════════════╗
║  📂 Manage Categories              ║
╠════════════════════════════════════╣
║                                    ║
║  [Category Name]  [Color] [Add]   ║
║                                    ║
║  🟦 Food               [Edit] [✕]  ║
║  🟦 Transport          [Edit] [✕]  ║
║  🟦 Shopping           [Edit] [✕]  ║
║  🟩 Custom Category 1  [Edit] [✕]  ║
║                                    ║
║  ─── Predefined Categories ───     ║
║  🟦 Bills              (Built-in)  ║
║  🟦 Entertainment      (Built-in)  ║
║  🟦 Healthcare         (Built-in)  ║
║  🟦 Education          (Built-in)  ║
║                                    ║
╚════════════════════════════════════╝
```

### Features
```
Add Category Flow:
1. User enters category name
2. Selects color from picker
3. Clicks "Add Category"
4. Category appears in list
5. Success toast shows

Edit Category Flow:
1. User clicks Edit button
2. Prompt for new name
3. Prompt for new color
4. Category updates in list
5. Success message shows

Delete Category Flow:
1. User clicks Delete button
2. Backend checks if used
3. If not used: deleted
4. If used: error message (prevent deletion)
5. List refreshes
```

### Color System
```
Custom Colors are user-selected hex codes:
┌────────────────────┐
│ [Color Picker]     │  ← User clicks to select
│ 🎨 #14b8a6         │  ← Current color display
└────────────────────┘

Predefined badge color: #94a3b8 (Gray)
Available colors: Full HTML5 color picker
```

---

## New Section: Data & Export

### UI Layout
```
╔════════════════════════════════════════╗
║  📊 Data & Export                      ║
╠════════════════════════════════════════╣
║                                        ║
║  [📥 Export Excel]  [📄 PDF Report]   ║
║                                        ║
║  [💾 Backup Data]   [♻️ Restore Data]  ║
║                                        ║
╚════════════════════════════════════════╝
```

### Export to Excel Flow
```
User clicks "Export Excel"
         ↓
Download starts automatically
         ↓
File: expenses_[username].xlsx
         ↓
Format:
┌────────┬──────────┬────────┬───────┐
│ Date   │ Category │ Amount │ Notes │
├────────┼──────────┼────────┼───────┤
│ 2026-  │ Food     │ 500    │ Lunch │
│ 01-14  │          │        │       │
├────────┼──────────┼────────┼───────┤
│ 2026-  │ Transport│ 200    │ Uber  │
│ 01-13  │          │        │       │
└────────┴──────────┴────────┴───────┘
```

### PDF Report Flow
```
User clicks "Download PDF"
         ↓
Generates current month report
         ↓
File: report_[username].pdf
         ↓
Contains:
- Header with user name & date
- Expense table (current month)
- Total spending summary
- Professional formatting
```

### Backup Flow
```
User clicks "Backup Data"
         ↓
Creates JSON file with:
- backup_date
- All expenses
- All budgets
- All custom categories
         ↓
File: backup_[username].json
         ↓
Sample structure:
{
  "backup_date": "2026-01-14T10:30:00",
  "expenses": [...],
  "budgets": [...],
  "categories": [...]
}
```

### Restore Flow
```
User clicks "Restore Data"
         ↓
File picker opens
         ↓
User selects backup_[username].json
         ↓
Confirmation dialog:
"This will restore all data from the backup.
 Existing data will be preserved. Continue?"
         ↓
If confirmed:
- Parse JSON
- Insert expenses
- Insert categories
- Show success message
- Reload UI
         ↓
If cancelled:
- Do nothing
- Close dialog
```

---

## New Section: Privacy & Security

### UI Layout
```
╔════════════════════════════════════════════╗
║  🔒 Privacy & Security                     ║
╠════════════════════════════════════════════╣
║                                            ║
║  Require Login on App Open          [○|●] ║
║  Prompt for password every time     OFF   ║
║                                            ║
║  Auto-Logout After Inactivity       [●|○] ║
║  Automatically logout after 30 min  ON    ║
║                                            ║
║  Hide Amounts (Privacy Mode)        [○|●] ║
║  Blur transaction amounts           OFF   ║
║                                            ║
║  Lock Analytics Page                [●|○] ║
║  Require password for analytics     ON    ║
║                                            ║
║                    [Save Security Settings]║
║                                            ║
╚════════════════════════════════════════════╝
```

### Toggle States
```
OFF State:
┌─────────────┐
│○┐  OFF      │  ← Toggle off
└─────────────┘

ON State:
┌─────────────┐
│ ┐●  ON      │  ← Toggle on
└─────────────┘
```

### Settings Effects

#### Require Login on App Open
```
When enabled:
- Every page requires @login_required check
- Session verification on each request
- Redirect to login if not authenticated
```

#### Auto-Logout After Inactivity
```
When enabled:
- Track last activity time
- Logout after 30 minutes
- Clear session
- Redirect to login
- Show "Session expired" message
```

#### Hide Amounts (Privacy Mode)
```
When enabled:
┌─────────────────────┐
│ Food    [HIDDEN]    │
│ Transport [HIDDEN]  │
│ Shopping [HIDDEN]   │
└─────────────────────┘

When disabled:
┌─────────────────────┐
│ Food       ₹500     │
│ Transport  ₹200     │
│ Shopping   ₹1500    │
└─────────────────────┘
```

#### Lock Analytics Page
```
When enabled:
/analytics → Password prompt
             → Verify password
             → Unlock page

When disabled:
/analytics → Direct access
```

---

## New Section: About

### UI Layout
```
╔════════════════════════════════════════╗
║  ℹ️  About SpendSense                  ║
╠════════════════════════════════════════╣
║                                        ║
║  App Name:              SpendSense     ║
║                                        ║
║  Version:               2.0.0          ║
║                                        ║
║  Developer:             SpendSense     ║
║                         Team           ║
║                                        ║
║  Support Email:         support@      ║
║                         spendsense.com ║
║                                        ║
║  Privacy Policy:        Read Policy    ║
║                         (link)         ║
║                                        ║
║  Terms of Service:      Read Terms     ║
║                         (link)         ║
║                                        ║
╚════════════════════════════════════════╝
```

### Content Details
```
Field              Value                    Type
────────────────   ─────────────────────   ──────────
App Name           SpendSense              Text
Version            2.0.0                   Version #
Developer          SpendSense Team         Text
Support Email      support@spendsense.com  Email Link
Privacy Policy     /privacy                External Link
Terms of Service   /terms                  External Link
```

---

## Data Flow Diagrams

### Category Management Flow
```
                    User Interface
                          │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          Add New      Edit      Delete Category
          Category     Category        │
              │           │           │
              └────┬──────┴──────┬────┘
                   ▼
          Frontend Validation
          ├─ Name required
          ├─ Name max 50 chars
          └─ Color format valid
                   │ ✓
                   ▼
        POST/PUT/DELETE Request
                   │
                   ▼
        Backend Validation
        ├─ User authenticated
        ├─ User owns category (PUT/DELETE)
        ├─ Category not in use (DELETE)
        └─ Name not duplicate
                   │ ✓
                   ▼
        Database Operation
        ├─ INSERT (Add)
        ├─ UPDATE (Edit)
        └─ DELETE (Delete)
                   │ ✓
                   ▼
        Return Success Response
                   │
                   ▼
        Reload Category List
                   │
                   ▼
        Show Toast Notification
```

### Export Flow
```
User Action
    │
    ├─ Export Excel → GET /api/export/excel
    │               → Generate .xlsx file
    │               → Stream to browser
    │               → Auto download
    │
    ├─ Export PDF  → GET /api/export/pdf
    │               → Generate .pdf file
    │               → Stream to browser
    │               → Auto download
    │
    ├─ Backup      → POST /api/backup
    │               → Create JSON snapshot
    │               → Stream to browser
    │               → Auto download
    │
    └─ Restore     → File picker
                   → Read JSON
                   → POST /api/restore
                   → Merge data
                   → Show report
```

### Security Settings Flow
```
User Toggles Setting
        │
        ▼
Frontend updates UI
(Toggle animation)
        │
        ▼
User clicks "Save"
        │
        ▼
POST /api/settings/security
{
  "require_login": boolean,
  "auto_logout": boolean,
  "hide_amounts": boolean,
  "lock_analytics": boolean
}
        │
        ▼
Backend Validation
├─ User authenticated
└─ Valid boolean values
        │ ✓
        ▼
UPDATE users table
SET require_login = ?,
    auto_logout = ?,
    hide_amounts = ?,
    lock_analytics = ?
WHERE id = ?
        │ ✓
        ▼
Return Success
        │
        ▼
Show Toast
"Security settings saved"
        │
        ▼
Store in sessionStorage
(For immediate UI effects)
```

---

## Responsive Design

### Desktop (≥768px)
```
┌──────────────────────────────────────┐
│                                      │
│  [📂 Categories] [📊 Export]         │
│  [🔒 Security]   [ℹ️ About]          │
│                                      │
│  Full width cards with side-by-side │
│  layout for large screens            │
└──────────────────────────────────────┘
```

### Tablet (481px-767px)
```
┌────────────────────────┐
│                        │
│  [📂 Categories]       │
│  [📊 Export]           │
│  [🔒 Security]         │
│  [ℹ️ About]            │
│                        │
│  Stacked layout but    │
│  optimized widths      │
└────────────────────────┘
```

### Mobile (≤480px)
```
┌──────────────────┐
│                  │
│  [📂 Categories] │
│  [📊 Export]     │
│  [🔒 Security]   │
│  [ℹ️ About]      │
│                  │
│  Single column   │
│  full width      │
│  stacked cards   │
└──────────────────┘
```

---

## Color Palette

### Theme Colors
```
Primary (Teal):   #14b8a6
Dark Teal:        #0d9488
Light Teal:       #ccfbf1

Text Colors:
├─ Heading:       #111827
├─ Body:          #4b5563
└─ Secondary:     #9ca3af

Background:
├─ Card:          #ffffff
├─ Light BG:      #f9fafb
└─ Border:        #e5e7eb
```

### Component Colors
```
Category Badges:
├─ User Selected:  Custom hex color
├─ Predefined:     #94a3b8 (Gray)
└─ Food/Transport/etc: Various (hardcoded)

Toggle Switch:
├─ Off:            Gray
└─ On:             #14b8a6 (Teal)

Buttons:
├─ Primary:        #14b8a6 (Teal)
├─ Secondary:      #f9fafb (Light)
└─ Icon:           Subtle gray
```

---

## Animation & Transitions

### Smooth Effects
```
Element                Duration    Easing
────────────────────   ──────────  ──────────
Category hover         200ms       ease-in
Toggle switch         300ms       ease
Button hover          200ms       ease
Toast notification    300ms       ease-out
Modal open            200ms       ease
```

---

## Accessibility Features

✅ **Keyboard Navigation**
- Tab through all inputs
- Enter to submit forms
- Spacebar for toggles
- Escape to close modals

✅ **Screen Reader Support**
- Proper label associations
- ARIA attributes where needed
- Semantic HTML structure

✅ **Color Contrast**
- WCAG AA compliant
- Dark mode support
- Focus indicators visible

✅ **Mobile Friendly**
- Touch-friendly button sizes
- Readable font sizes
- Proper spacing

---

**Visual Documentation Complete** ✅
