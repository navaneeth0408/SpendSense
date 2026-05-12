# Golden Theme Quick Reference Guide

## Color Palette

```
Golden Yellow (Primary):    #F5C518
Golden Yellow (Hover):      #FFD700
Dark Navy (Text/Icons):     #1f2a44
Glow Effect:                rgba(245, 197, 24, 0.4)
```

## Button Classes & Elements

### Weekly Summary Navigation
```html
<button class="week-nav-btn" id="prev-week-btn">← Previous</button>
<button class="week-nav-btn" id="next-week-btn">Next →</button>
```
**CSS**: `.week-nav-btn`
**Color**: #F5C518 (gold) on #1f2a44 (dark navy)
**Hover**: #FFD700 with golden glow

### Export to CSV
```html
<button id="export-btn" class="export-btn">Export to CSV</button>
```
**CSS**: `.export-btn`
**Color**: #F5C518 (gold) on #1f2a44 (dark navy)
**Hover**: #FFD700 with golden glow

---

## Dropdown Selects (Arrow-Free)

### Currency Selector
```html
<select id="currency" class="currency-select">
    <option value="INR" data-symbol="₹">₹ INR</option>
    <option value="USD" data-symbol="$">$ USD</option>
</select>
```
**CSS**: `.currency-select`
**Feature**: `appearance: none` (no arrow)

### Category Selector
```html
<select id="category">
    <option value="">Select Category</option>
    <option value="Food">Food</option>
</select>
```
**CSS**: `.form-group select` (parent), inherits `appearance: none`
**Feature**: Clean dropdown, no arrow icon

### Recurrence Selector
```html
<select id="recurring-frequency" class="recurring-frequency-select">
    <option value="">None (One-time)</option>
    <option value="weekly">Weekly</option>
</select>
```
**CSS**: `.recurring-frequency-select`
**Feature**: `appearance: none` (no arrow), dark mode support

### Year/Month Selectors
```html
<select id="year-select" class="year-select"></select>
<select id="month-select" class="month-select"></select>
```
**CSS**: `.year-select`, `.month-select`
**Feature**: `appearance: none` (no arrow)

### Category Filter
```html
<select id="category-filter" class="category-filter-select">
    <option value="">All Categories</option>
</select>
```
**CSS**: `.category-filter-select`
**Feature**: `appearance: none` (no arrow)

### Yearly Year Select
```html
<select id="yearly-year-select" class="yearly-year-select"></select>
```
**CSS**: `.yearly-year-select`
**Feature**: `appearance: none` (no arrow)

---

## CSS Properties Applied

### Golden Buttons
```css
background: #F5C518;
border: 1.5px solid #F5C518;
color: #1f2a44;
border-radius: 8px;
padding: 8px 10px; /* nav buttons */
padding: 8px 16px;  /* export button */
transition: all 0.2s ease;

/* Hover state */
background: #FFD700;
border-color: #FFD700;
box-shadow: 0 4px 12px rgba(245, 197, 24, 0.4);
transform: translateY(-1px);
```

### Clean Dropdowns
```css
appearance: none;
background: var(--card-white); /* light mode */
background: #111A2E;           /* dark mode */
border: 1.5px solid var(--border-light);
border-radius: 8px;
padding: 12px 14px;
cursor: pointer;
font-family: inherit;
```

---

## Dark Mode Support

All golden button colors and dropdown styles work in dark mode automatically:

```css
/* Dark mode applies same colors */
[data-theme="dark"] .week-nav-btn {
    background: #F5C518;        /* Same gold */
    color: #1f2a44;             /* Same dark navy */
}

[data-theme="dark"] .export-btn {
    background: #F5C518;        /* Same gold */
    color: #1f2a44;             /* Same dark navy */
}

[data-theme="dark"] select {
    appearance: none;           /* Same clean look */
    background: #111A2E;        /* Dark mode background */
}
```

---

## Usage Examples

### Adding a New Golden Button
```css
.my-golden-button {
    background: #F5C518;
    border: 1.5px solid #F5C518;
    color: #1f2a44;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.my-golden-button:hover {
    background: #FFD700;
    border-color: #FFD700;
    box-shadow: 0 4px 12px rgba(245, 197, 24, 0.4);
    transform: translateY(-1px);
}
```

### Adding a Clean Dropdown
```css
.my-dropdown {
    appearance: none;
    background: var(--card-white);
    border: 1.5px solid var(--border-light);
    border-radius: 10px;
    padding: 12px 14px;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
}

[data-theme="dark"] .my-dropdown {
    background: #111A2E;
    border: 1px solid #1F2A44;
    color: #E8ECF1;
    appearance: none;
}
```

---

## Testing Checklist

When making changes involving golden theme or dropdowns:

- [ ] Golden buttons display correct color (#F5C518)
- [ ] Hover state shows lighter gold (#FFD700)
- [ ] Glow effect visible on hover
- [ ] Icon color contrasts well (#1f2a44 on gold)
- [ ] All dropdowns display without arrow icons
- [ ] Dropdowns still fully functional
- [ ] Dark mode applies correctly
- [ ] No layout shifts when removing arrows
- [ ] Padding/margins look balanced
- [ ] Text remains readable in all states
- [ ] Focus states work for accessibility
- [ ] Mobile/responsive view works

---

## Common Issues & Solutions

### Issue: Arrow Still Showing
**Solution**: Ensure `.recurring-frequency-select`, `.form-group select`, or other select has `appearance: none` property

### Issue: Golden Button Not Showing Color
**Solution**: Check for `!important` overrides or conflicting CSS rules. Golden color should be: `background: #F5C518`

### Issue: Dark Mode Golden Buttons Wrong Color
**Solution**: Verify `[data-theme="dark"] .week-nav-btn` has `background: #F5C518` (same as light mode)

### Issue: Dropdown Text Color Wrong
**Solution**: Ensure `color: var(--text-heading)` (light mode) or `color: #E8ECF1` (dark mode) is applied

### Issue: Hover Glow Not Visible
**Solution**: Check box-shadow property: `0 4px 12px rgba(245, 197, 24, 0.4)`

---

## Related Files

- **Main CSS**: `static/css/style.css`
- **HTML Templates**: `templates/index.html`, `templates/reports.html`, others
- **JavaScript**: No JS changes needed for this styling
- **Documentation**: 
  - `UI_GOLDEN_THEME_IMPLEMENTATION.md` - Full implementation details
  - `UI_GOLDEN_THEME_VISUAL_GUIDE.md` - Before/after comparisons
  - `CSS_CHANGES_DETAILED.md` - Line-by-line CSS changes

---

## Design System Variables

For consistency, use these CSS variables from root:

```css
:root {
    --navy-dark: #1f2a44;           /* Dark navy for text on gold */
    --card-white: #ffffff;          /* Light mode dropdowns */
    --border-light: #e5e7eb;        /* Light mode borders */
    --text-heading: #1f2a44;        /* Text color light mode */
}

[data-theme="dark"] {
    --card-white: #111A2E;          /* Dark mode dropdowns */
    --border-light: #1F2A44;        /* Dark mode borders */
    --text-heading: #E8ECF1;        /* Text color dark mode */
}
```

## Future Enhancements

1. Add ripple effect to golden buttons for more premium feel
2. Create gradient version of golden buttons
3. Add animation to dropdown opening
4. Create golden accent for focus states
5. Add secondary button style with golden outline
