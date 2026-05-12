// Settings Page JavaScript

(function() {
    // Initialize settings page
    function initSettings() {
        loadSettings();
        setupEventListeners();
        initTheme();
    }

    // Theme initialization
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        const themeToggleBtn = document.getElementById('theme-toggle');
        const icon = themeToggleBtn.querySelector('.theme-icon');
        if (theme === 'dark') {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
        } else {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
        }
    }

    // Load settings from server
    function loadSettings() {
        Promise.all([
            fetch('/api/settings/profile').then(r => r.json()),
            fetch('/api/settings/localization').then(r => r.json()),
            fetch('/api/settings/notifications').then(r => r.json())
        ])
        .then(([profileData, locData, notifData]) => {
            console.log('Settings loaded:', { profileData, locData, notifData });
            
            // Load profile data
            if (profileData && !profileData.error) {
                document.getElementById('username-input').value = profileData.username || '';
                document.getElementById('preferred-name-input').value = profileData.preferred_name || '';
                document.getElementById('email-input').value = profileData.email || '';
                document.getElementById('username-display').textContent = profileData.username || 'User';
            }

            // Load localization data
            if (locData && !locData.error) {
                document.getElementById('currency-select').value = locData.currency || 'INR';
                document.getElementById('date-format-select').value = locData.date_format || 'DD/MM/YYYY';
                document.getElementById('number-format-select').value = locData.number_format || 'en-IN';
            }

            // Load notification preferences
            if (notifData && !notifData.error) {
                document.getElementById('budget-alert-toggle').checked = notifData.budget_alert || false;
                document.getElementById('spike-alert-toggle').checked = notifData.spike_alert || false;
                document.getElementById('weekly-summary-toggle').checked = notifData.weekly_summary || false;
                document.getElementById('monthly-report-toggle').checked = notifData.monthly_report || false;
            }
        })
        .catch(err => {
            console.error('Error loading settings:', err);
            showToast('Failed to load settings', 'error');
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

        // Profile & Account
        document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
        document.getElementById('change-password-btn').addEventListener('click', openPasswordModal);
        document.getElementById('logout-all-btn').addEventListener('click', logoutAll);

        // Localization
        document.getElementById('save-localization-btn').addEventListener('click', saveLocalization);

        // Notifications
        document.getElementById('save-notifications-btn').addEventListener('click', saveNotifications);

        // Email modal
        document.getElementById('update-email-btn').addEventListener('click', openEmailModal);
        document.getElementById('email-modal-close').addEventListener('click', closeEmailModal);
        document.getElementById('email-modal-cancel').addEventListener('click', closeEmailModal);
        document.getElementById('email-update-confirm').addEventListener('click', confirmEmailUpdate);

        // Password modal
        document.getElementById('password-modal-close').addEventListener('click', closePasswordModal);
        document.getElementById('password-modal-cancel').addEventListener('click', closePasswordModal);
        document.getElementById('password-change-confirm').addEventListener('click', confirmPasswordChange);
        document.getElementById('modal-overlay').addEventListener('click', closePasswordModal);

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', logout);

        // Auto-save on change (debounced)
        const inputs = document.querySelectorAll('.setting-input, .setting-select');
        inputs.forEach(input => {
            input.addEventListener('change', function() {
                if (this.id.includes('username') || this.id.includes('preferred')) {
                    saveProfile();
                } else if (this.id.includes('currency') || this.id.includes('date') || this.id.includes('number')) {
                    saveLocalization();
                }
            });
        });

        // Auto-save toggles
        const toggles = document.querySelectorAll('.toggle-input');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', saveNotifications);
        });

        // Categories Management
        document.getElementById('add-category-btn').addEventListener('click', addCategory);
        loadCategories();

        // Data & Export
        document.getElementById('export-excel-btn').addEventListener('click', exportExcel);
        document.getElementById('export-pdf-btn').addEventListener('click', exportPDF);
        document.getElementById('backup-data-btn').addEventListener('click', backupData);
        document.getElementById('restore-data-btn').addEventListener('click', restoreData);
        
        // PDF Export with Period
        initPDFExportPeriod();
        document.getElementById('export-pdf-with-period-btn').addEventListener('click', exportPDFWithPeriod);

        // Privacy & Security
        document.getElementById('save-security-btn').addEventListener('click', saveSecuritySettings);
        loadSecuritySettings();
    }

    // Save Profile
    function saveProfile() {
        const username = document.getElementById('username-input').value;
        const preferredName = document.getElementById('preferred-name-input').value;

        if (!username.trim()) {
            showToast('Username cannot be empty', 'error');
            return;
        }

        const data = {
            username: username.trim(),
            preferred_name: preferredName.trim()
        };

        fetch('/api/settings/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(result => {
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Profile saved successfully', 'success');
                document.getElementById('username-display').textContent = username;
            }
        })
        .catch(err => {
            console.error('Error saving profile:', err);
            showToast('Failed to save profile', 'error');
        });
    }

    // Save Localization
    function saveLocalization() {
        const currency = document.getElementById('currency-select').value;
        const dateFormat = document.getElementById('date-format-select').value;
        const numberFormat = document.getElementById('number-format-select').value;

        const data = {
            currency: currency,
            date_format: dateFormat,
            number_format: numberFormat
        };

        fetch('/api/settings/localization', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(result => {
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Localization settings saved', 'success');
                // Note: Page refresh would be needed to fully apply changes
                // For now, settings are saved server-side
            }
        })
        .catch(err => {
            console.error('Error saving localization:', err);
            showToast('Failed to save localization settings', 'error');
        });
    }

    // Save Notifications
    function saveNotifications() {
        const data = {
            budget_alert: document.getElementById('budget-alert-toggle').checked,
            spike_alert: document.getElementById('spike-alert-toggle').checked,
            weekly_summary: document.getElementById('weekly-summary-toggle').checked,
            monthly_report: document.getElementById('monthly-report-toggle').checked
        };

        fetch('/api/settings/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(result => {
            if (result.error) {
                console.error('Error:', result.error);
            } else {
                showToast('Notification preferences saved', 'success');
            }
        })
        .catch(err => {
            console.error('Error saving notifications:', err);
        });
    }

    // Password Modal Functions
    function openPasswordModal() {
        document.getElementById('password-modal').style.display = 'block';
        document.getElementById('modal-overlay').style.display = 'block';
        document.getElementById('current-password-input').value = '';
        document.getElementById('new-password-input').value = '';
        document.getElementById('confirm-password-input').value = '';
    }

    function closePasswordModal() {
        document.getElementById('password-modal').style.display = 'none';
        document.getElementById('modal-overlay').style.display = 'none';
    }

    function confirmPasswordChange() {
        const currentPassword = document.getElementById('current-password-input').value;
        const newPassword = document.getElementById('new-password-input').value;
        const confirmPassword = document.getElementById('confirm-password-input').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('All fields are required', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        const data = {
            current_password: currentPassword,
            new_password: newPassword
        };

        fetch('/api/settings/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(result => {
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Password changed successfully', 'success');
                closePasswordModal();
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Failed to change password', 'error');
        });
    }

    // Email Modal Functions
    function openEmailModal() {
        document.getElementById('email-modal').style.display = 'block';
        document.getElementById('modal-overlay').style.display = 'block';
        document.getElementById('new-email-input').value = '';
        document.getElementById('email-password-input').value = '';
    }

    function closeEmailModal() {
        document.getElementById('email-modal').style.display = 'none';
        document.getElementById('modal-overlay').style.display = 'none';
    }

    function confirmEmailUpdate() {
        const newEmail = document.getElementById('new-email-input').value.trim();
        const password = document.getElementById('email-password-input').value;

        if (!newEmail || !password) {
            showToast('All fields are required', 'error');
            return;
        }

        if (!isValidEmail(newEmail)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        const currentEmail = document.getElementById('email-input').value;
        if (newEmail === currentEmail) {
            showToast('New email must be different from current email', 'error');
            return;
        }

        const data = {
            new_email: newEmail,
            password: password
        };

        fetch('/api/settings/update-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(result => {
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Email updated successfully', 'success');
                // Update the email field
                document.getElementById('email-input').value = newEmail;
                closeEmailModal();
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Failed to update email', 'error');
        });
    }

    // Email validation helper
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Logout from all devices
    function logoutAll() {
        if (confirm('Are you sure you want to logout from all devices? You will need to login again.')) {
            fetch('/api/settings/logout-all', {
                method: 'POST'
            })
            .then(r => r.json())
            .then(result => {
                showToast('Logged out from all devices', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            })
            .catch(err => {
                console.error('Error:', err);
                showToast('Failed to logout', 'error');
            });
        }
    }

    // Regular logout
    function logout() {
        fetch('/api/logout', {
            method: 'POST'
        })
        .then(() => {
            window.location.href = '/';
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Failed to logout', 'error');
        });
    }

    // Toast notification
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast-notification');
        const toastMessage = document.getElementById('toast-message');

        toastMessage.textContent = message;
        toast.className = 'toast-notification show';
        if (type === 'error') {
            toast.classList.add('error');
        }

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ===== CATEGORIES MANAGEMENT =====

    function loadCategories() {
        fetch('/api/settings/categories')
            .then(r => r.json())
            .then(result => {
                const listContainer = document.getElementById('categories-list');
                listContainer.innerHTML = '';

                // Add custom categories
                result.custom.forEach(cat => {
                    const item = document.createElement('div');
                    item.className = 'category-item';
                    item.innerHTML = `
                        <div class="category-badge" style="background-color: ${cat.color}"></div>
                        <span class="category-name">${cat.name}</span>
                        <div class="category-actions">
                            <button class="btn-icon edit-category" data-id="${cat.id}">✎</button>
                            <button class="btn-icon delete-category" data-id="${cat.id}">✕</button>
                        </div>
                    `;
                    listContainer.appendChild(item);

                    // Add event listeners
                    item.querySelector('.edit-category').addEventListener('click', () => editCategory(cat.id, cat.name, cat.color));
                    item.querySelector('.delete-category').addEventListener('click', () => deleteCategory(cat.id));
                });

                // Add predefined categories (read-only)
                const predefinedHeader = document.createElement('div');
                predefinedHeader.className = 'category-header';
                predefinedHeader.textContent = 'Predefined Categories';
                listContainer.appendChild(predefinedHeader);

                result.predefined.forEach(cat => {
                    const item = document.createElement('div');
                    item.className = 'category-item predefined';
                    item.innerHTML = `
                        <div class="category-badge" style="background-color: #94a3b8"></div>
                        <span class="category-name">${cat}</span>
                        <span class="category-label">(Built-in)</span>
                    `;
                    listContainer.appendChild(item);
                });
            })
            .catch(err => {
                console.error('Error loading categories:', err);
                showToast('Failed to load categories', 'error');
            });
    }

    function addCategory() {
        const name = document.getElementById('new-category-name').value.trim();
        const color = document.getElementById('new-category-color').value;

        if (!name) {
            showToast('Category name is required', 'error');
            return;
        }

        fetch('/api/settings/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color })
        })
        .then(r => r.json())
        .then(result => {
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Category added successfully', 'success');
                document.getElementById('new-category-name').value = '';
                loadCategories();
                // Emit event to update dashboard dropdown
                window.dispatchEvent(new CustomEvent('categoriesUpdated', { detail: { name, color, id: result.id } }));
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Failed to add category', 'error');
        });
    }

    function editCategory(id, name, color) {
        const newName = prompt('Edit category name:', name);
        if (!newName || !newName.trim()) return;

        const newColor = prompt('Choose color (hex code):', color) || color;

        fetch(`/api/settings/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim(), color: newColor })
        })
        .then(r => r.json())
        .then(result => {
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Category updated successfully', 'success');
                loadCategories();
                // Emit event to update dashboard
                window.dispatchEvent(new CustomEvent('categoriesUpdated', { detail: { id, name: newName.trim(), color: newColor } }));
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Failed to update category', 'error');
        });
    }

    function deleteCategory(id) {
        if (!confirm('Delete this category? This action cannot be undone.')) return;

        fetch(`/api/settings/categories/${id}`, {
            method: 'DELETE'
        })
        .then(r => r.json())
        .then(result => {
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Category deleted successfully', 'success');
                loadCategories();
                // Emit event to update dashboard
                window.dispatchEvent(new CustomEvent('categoriesUpdated', { detail: { id, deleted: true } }));
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Failed to delete category', 'error');
        });
    }

    // ===== DATA & EXPORT =====

    function exportExcel() {
        window.location.href = '/api/export/excel';
        showToast('Excel file downloaded', 'success');
    }

    function exportPDF() {
        window.location.href = '/api/export/pdf';
        showToast('PDF file downloaded', 'success');
    }

    // Initialize PDF Export Period Selector
    function initPDFExportPeriod() {
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentYear = now.getFullYear();
        
        // Populate year dropdown
        const yearSelect = document.getElementById('pdf-export-year');
        if (yearSelect) {
            // Clear existing options
            yearSelect.innerHTML = '';
            
            // Add years from current year - 5 to current year + 5
            for (let i = currentYear - 5; i <= currentYear + 5; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                yearSelect.appendChild(option);
            }
            
            // Set default to current year
            yearSelect.value = currentYear;
        }
        
        // Set default month to current month
        const monthSelect = document.getElementById('pdf-export-month');
        if (monthSelect) {
            monthSelect.value = currentMonth;
        }
    }

    // Export PDF with Selected Month and Year
    function exportPDFWithPeriod() {
        const month = document.getElementById('pdf-export-month').value;
        const year = document.getElementById('pdf-export-year').value;
        
        if (!month || !year) {
            showToast('Please select month and year', 'error');
            return;
        }
        
        // Trigger download with period parameters
        window.location.href = `/api/export/pdf?month=${month}&year=${year}`;
        showToast('PDF report generated and downloaded', 'success');
    }

    function backupData() {
        window.location.href = '/api/backup';
        showToast('Backup file downloaded', 'success');
    }

    function restoreData() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    
                    if (!confirm('This will restore all data from the backup. Existing data will be preserved. Continue?')) {
                        return;
                    }

                    fetch('/api/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(backupData)
                    })
                    .then(r => r.json())
                    .then(result => {
                        if (result.error) {
                            showToast(result.error, 'error');
                        } else {
                            showToast(`Data restored: ${result.expenses_restored} expenses, ${result.categories_restored} categories`, 'success');
                            loadCategories();
                        }
                    })
                    .catch(err => {
                        console.error('Error:', err);
                        showToast('Failed to restore data', 'error');
                    });
                } catch (err) {
                    showToast('Invalid backup file format', 'error');
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    }

    // ===== PRIVACY & SECURITY =====

    function loadSecuritySettings() {
        fetch('/api/settings/security')
            .then(r => r.json())
            .then(result => {
                if (!result.error) {
                    document.getElementById('require-login-toggle').checked = result.require_login || false;
                    document.getElementById('auto-logout-toggle').checked = result.auto_logout || false;
                    document.getElementById('hide-amounts-toggle').checked = result.hide_amounts || false;
                    document.getElementById('lock-analytics-toggle').checked = result.lock_analytics || false;
                }
            })
            .catch(err => console.error('Error loading security settings:', err));
    }

    function saveSecuritySettings() {
        const data = {
            require_login: document.getElementById('require-login-toggle').checked,
            auto_logout: document.getElementById('auto-logout-toggle').checked,
            hide_amounts: document.getElementById('hide-amounts-toggle').checked,
            lock_analytics: document.getElementById('lock-analytics-toggle').checked
        };

        fetch('/api/settings/security', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(result => {
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Security settings saved', 'success');
                // Store in sessionStorage to apply immediately if needed
                sessionStorage.setItem('hide_amounts', data.hide_amounts);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Failed to save security settings', 'error');
        });
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSettings);
    } else {
        initSettings();
    }
})();
