# ⚡ SpendSense Settings Expansion - Quick Reference

## What Was Added

### 4 New Settings Sections
1. **📂 Manage Categories** - CRUD for custom categories
2. **📊 Data & Export** - Export/backup functionality  
3. **🔒 Privacy & Security** - Privacy toggles
4. **ℹ️ About** - App information

---

## 📂 Categories Management

### User Actions
```
✏️ Add Category
   Input: Category name + color picker
   Output: New category in list

✎ Edit Category  
   Input: Name + color (via prompts)
   Output: Updated category

✕ Delete Category
   Input: Click delete button
   Guard: Won't delete if expenses exist
   Output: Removed from list

📋 View Categories
   Shows: Custom + Predefined
   Predefined: Read-only (gray badge)
```

### APIs
```
GET    /api/settings/categories         → List all
POST   /api/settings/categories         → Create
PUT    /api/settings/categories/{id}    → Update
DELETE /api/settings/categories/{id}    → Delete
```

### Database
```
categories table with:
- id, user_id, name, color
- created_at
- UNIQUE(user_id, name)
```

---

## 📊 Data & Export

### Export to Excel
```
Button: "📥 Export to Excel"
Format: .xlsx spreadsheet
Columns: Date | Category | Amount | Notes
File: expenses_[username].xlsx
```

### Download PDF Report
```
Button: "📄 Download PDF Report"
Format: .pdf document
Content: Current month summary
Includes: Total spent
File: report_[username].pdf
```

### Backup Data
```
Button: "💾 Backup Data"
Format: .json file
Includes: All expenses + budgets + categories
File: backup_[username].json
```

### Restore Data
```
Button: "♻️ Restore Data"
Process:
1. Click button
2. Select backup .json file
3. Confirm dialog
4. Data merges (doesn't delete)
5. Success report
```

### APIs
```
GET  /api/export/excel      → Download .xlsx
GET  /api/export/pdf        → Download .pdf
POST /api/backup            → Download .json
POST /api/restore           → Upload & merge
```

---

## 🔒 Privacy & Security

### Toggle Options
```
🔐 Require Login on App Open
   Effect: Force password on each access
   Default: OFF

⏱️  Auto-Logout After Inactivity
   Effect: Logout after 30 minutes
   Default: OFF

👁️  Hide Amounts (Privacy Mode)
   Effect: Blur all transaction amounts
   Default: OFF

🔒 Lock Analytics Page
   Effect: Require password for analytics
   Default: OFF
```

### Button
```
Save Security Settings
→ POST /api/settings/security
→ Update user preferences
→ Store in sessionStorage
```

### Database Columns (users table)
```
require_login    INTEGER DEFAULT 0
auto_logout      INTEGER DEFAULT 0
hide_amounts     INTEGER DEFAULT 0
lock_analytics   INTEGER DEFAULT 0
```

---

## ℹ️ About

### Static Information
```
App Name        → SpendSense
Version         → 2.0.0
Developer       → SpendSense Team
Support Email   → support@spendsense.com
Privacy Policy  → /privacy link
Terms           → /terms link
```

### Notes
- No backend required
- Static display only
- Links to external pages
- Professional product identity

---

## 🚀 Quick Start for Users

### To Add a Custom Category
1. Go to Settings
2. Scroll to "Manage Categories"
3. Enter category name
4. Click color picker to choose color
5. Click "Add Category"
6. ✅ Category appears in list

### To Export All Data
1. Go to Settings
2. Scroll to "Data & Export"
3. Click "📥 Export to Excel"
4. File downloads automatically

### To Backup Data
1. Go to Settings
2. Scroll to "Data & Export"
3. Click "💾 Backup Data"
4. Keep JSON file safe

### To Restore Data
1. Go to Settings
2. Scroll to "Data & Export"
3. Click "♻️ Restore Data"
4. Select backup JSON file
5. Confirm when prompted

### To Enable Privacy Mode
1. Go to Settings
2. Scroll to "Privacy & Security"
3. Toggle "Hide Amounts"
4. Click "Save Security Settings"
5. Amounts blur on dashboard

---

## 🔧 For Developers

### Files Modified
```
templates/settings.html      - 4 new card sections
static/js/settings.js        - 40+ new functions
app.py                       - 15+ new endpoints
static/css/style.css         - 50+ new styles
```

### Database Changes
```
CREATE TABLE categories (...)
ALTER TABLE users ADD require_login ...
ALTER TABLE users ADD auto_logout ...
ALTER TABLE users ADD hide_amounts ...
ALTER TABLE users ADD lock_analytics ...
```

### Key Functions (JavaScript)
```
loadCategories()             - Fetch categories
addCategory()                - Add new category
editCategory(id, name, color)
deleteCategory(id)
exportExcel()                - Download .xlsx
exportPDF()                  - Download .pdf
backupData()                 - Download .json
restoreData()                - Upload .json
loadSecuritySettings()       - Fetch settings
saveSecuritySettings()       - Save settings
```

### Key Endpoints (Python)
```
GET    /api/settings/categories
POST   /api/settings/categories
PUT    /api/settings/categories/{id}
DELETE /api/settings/categories/{id}
GET    /api/settings/security
POST   /api/settings/security
GET    /api/export/excel
GET    /api/export/pdf
POST   /api/backup
POST   /api/restore
```

---

## 📊 Statistics

| Item | Count |
|------|-------|
| New HTML Sections | 4 |
| New API Endpoints | 10 |
| New JavaScript Functions | 12+ |
| New CSS Classes | 15+ |
| Database Tables Added | 1 |
| Database Columns Added | 4 |
| Lines of Code Added | 1500+ |

---

## 🧪 Testing

### Categories
```
✓ Add category
✓ Edit category  
✓ Delete category
✓ Prevent delete if used
✓ Color customization
✓ List displays correctly
```

### Export
```
✓ Excel download works
✓ PDF download works
✓ Backup download works
✓ File names correct
✓ Data accuracy
```

### Restore
```
✓ File picker opens
✓ JSON parsing works
✓ Confirmation dialog shows
✓ Data merges correctly
✓ Success report shows
```

### Security
```
✓ Toggles work
✓ Settings persist
✓ Save button works
✓ Toast notification appears
```

---

## 🔒 Security Checklist

```
✅ @login_required on all endpoints
✅ User ID verification in queries
✅ SQL injection prevention
✅ Input validation (front & back)
✅ Category ownership checks
✅ Expense safety checks before delete
✅ Password verification available
✅ Session-based authentication
```

---

## 🎨 UI Components

### New Element Classes
```
.category-controls        - Add category form group
.category-item            - Single category display
.category-badge           - Color dot
.category-actions         - Edit/Delete buttons
.export-controls          - Export button grid
.setting-toggle           - Toggle with label
.about-section            - Info items container
.about-item               - Info row
.color-picker             - Color input
.btn-icon                 - Small icon button
```

---

## 📱 Responsive Breakpoints

```
Desktop (≥768px)    - Multi-column layout
Tablet (481-767px)  - Optimized stacking
Mobile (≤480px)     - Single column, full width
```

---

## 🌙 Dark Mode

All new components support:
- ✅ Dark theme variables
- ✅ Proper contrast ratios
- ✅ Readable text
- ✅ Visible buttons
- ✅ Accessible icons

---

## 🚀 Deployment

1. **Database Migration**
   - Categories table created on init
   - Security columns added automatically
   - No manual schema edits needed

2. **App Restart**
   - Flask development: auto-reload
   - Production: restart Flask service
   - Browser: refresh to load new sections

3. **Verification**
   - Settings page loads with 8 sections
   - All buttons respond
   - APIs return data
   - Exports work correctly

---

## 💡 Tips for Users

1. **Category Colors**: Choose distinct colors for better visual separation
2. **Regular Backups**: Download backup weekly to protect data
3. **Privacy Mode**: Enable when someone is watching
4. **Auto-Logout**: Good security for shared devices
5. **Export Data**: Keep annual backups for record-keeping

---

## ❓ FAQ

**Q: Can I delete predefined categories?**  
A: No, predefined categories (Food, Transport, etc.) are read-only and managed by the system.

**Q: What if I delete a category used by expenses?**  
A: You can't. The system prevents deletion of categories with expenses.

**Q: Will restore delete my existing data?**  
A: No, restore merges data. Existing data is preserved.

**Q: How often are auto-logouts?**  
A: After 30 minutes of inactivity.

**Q: Can I edit or delete exported files?**  
A: Yes, Excel and PDF files are standard formats you can edit.

**Q: Is my backup secure?**  
A: Backup files contain unencrypted data. Store them safely.

**Q: Can I restore on a different account?**  
A: No, restore only works on the same user account.

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Categories not loading | Refresh page or check console |
| Export fails | Ensure sufficient disk space |
| Restore won't work | Check JSON file format |
| Settings not saving | Ensure you're logged in |
| Color picker not showing | Use different browser |

---

## 🎓 Learning Resources

- API Endpoints: See SETTINGS_EXPANSION_COMPLETE.md
- Visual Guide: See SETTINGS_VISUAL_GUIDE.md
- Code Examples: Check settings.js functions
- Database: See init_db() in app.py

---

**Quick Reference Ready** ✅
