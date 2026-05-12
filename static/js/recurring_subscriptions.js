// Recurring Expenses & Subscriptions Management
// Updated: 2026-01-19 - Cleanup unlabeled checkboxes

let currentRecurringPage = 1;
let currentSubscriptionPage = 1;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndInit();
});

async function checkAuthAndInit() {
    try {
        const response = await fetch('/api/check-auth');
        if (!response.ok) {
            window.location.href = '/';
            return;
        }
        
        // Load user info
        const data = await response.json();
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = data.preferred_name || data.username || 'User';
        }
        
        // Initialize page
        loadRecurringExpenses();
        loadSubscriptions();
        setupRecurringForm();
        setupSubscriptionForm();
        setupThemeToggle();
        setupLogout();
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/';
    }
}

function setupRecurringForm() {
    const form = document.getElementById('recurring-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const recurring = {
                name: document.getElementById('recurring-name').value,
                amount: parseFloat(document.getElementById('recurring-amount').value),
                category: document.getElementById('recurring-category').value,
                frequency: document.getElementById('recurring-frequency').value,
                start_date: document.getElementById('recurring-start-date').value,
                currency: document.getElementById('recurring-currency').value
            };

            try {
                const response = await fetch('/api/recurring', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recurring)
                });

                if (response.ok) {
                    showSnackbar('Recurring expense added successfully!');
                    form.reset();
                    loadRecurringExpenses();
                } else {
                    const error = await response.json();
                    showSnackbar('Error: ' + error.error, true);
                }
            } catch (error) {
                showSnackbar('Error adding recurring expense', true);
            }
        });
    }
}

function setupSubscriptionForm() {
    const form = document.getElementById('subscription-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const subscription = {
                service_name: document.getElementById('subscription-service').value,
                amount: parseFloat(document.getElementById('subscription-amount').value),
                billing_cycle: document.getElementById('subscription-cycle').value,
                renewal_date: document.getElementById('subscription-renewal').value,
                currency: document.getElementById('subscription-currency').value
            };

            try {
                const response = await fetch('/api/subscriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });

                if (response.ok) {
                    showSnackbar('Subscription added successfully!');
                    form.reset();
                    loadSubscriptions();
                } else {
                    const error = await response.json();
                    showSnackbar('Error: ' + error.error, true);
                }
            } catch (error) {
                showSnackbar('Error adding subscription', true);
            }
        });
    }
}

async function loadRecurringExpenses() {
    try {
        console.log('[Recurring] Fetching recurring expenses...');
        const response = await fetch('/api/recurring');
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[Recurring] Received response:', data);
        
        // Validate data structure - API returns array directly
        if (!Array.isArray(data)) {
            console.error('[Recurring] Invalid response format - expected array, got:', typeof data);
            displayRecurringExpenses([]);
            updateRecurringStats([]);
            return;
        }
        
        console.log(`[Recurring] Loaded ${data.length} recurring expenses`);
        displayRecurringExpenses(data);
        updateRecurringStats(data);
    } catch (error) {
        console.error('[Recurring] Error loading recurring expenses:', error);
        const container = document.getElementById('recurring-list');
        if (container) {
            container.innerHTML = '<p class="empty-state">❌ Error loading recurring expenses. Please try again later.</p>';
        }
        showSnackbar('Error loading recurring expenses', true);
    }
}

async function loadSubscriptions() {
    try {
        console.log('[Subscriptions] Fetching subscriptions...');
        const response = await fetch('/api/subscriptions');
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[Subscriptions] Received response:', data);
        
        // Validate data structure - API returns { subscriptions: [], total_monthly_cost: X }
        if (!data || typeof data !== 'object') {
            console.error('[Subscriptions] Invalid response format - expected object, got:', typeof data);
            displaySubscriptions([]);
            updateSubscriptionStats({ subscriptions: [], total_monthly_cost: 0 });
            return;
        }
        
        const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
        const totalCost = typeof data.total_monthly_cost === 'number' ? data.total_monthly_cost : 0;
        
        console.log(`[Subscriptions] Loaded ${subscriptions.length} subscriptions, total monthly: ${totalCost}`);
        displaySubscriptions(subscriptions);
        updateSubscriptionStats({ subscriptions, total_monthly_cost: totalCost });
    } catch (error) {
        console.error('[Subscriptions] Error loading subscriptions:', error);
        const container = document.getElementById('subscription-list');
        if (container) {
            container.innerHTML = '<p class="empty-state">❌ Error loading subscriptions. Please try again later.</p>';
        }
        showSnackbar('Error loading subscriptions', true);
    }
}

function displayRecurringExpenses(recurring) {
    const container = document.getElementById('recurring-list');
    
    // Safety check: ensure container exists
    if (!container) {
        console.error('[Recurring] Container not found in DOM');
        return;
    }
    
    // Validate input - should be array
    if (!Array.isArray(recurring)) {
        console.error('[Recurring] Invalid input - expected array, got:', typeof recurring);
        container.innerHTML = '<p class="empty-state">❌ Invalid data received</p>';
        return;
    }
    
    console.log('[Recurring] Rendering', recurring.length, 'items');
    
    if (recurring.length === 0) {
        container.innerHTML = '<p class="empty-state">📭 No recurring expenses yet. Add one to get started!</p>';
        console.log('[Recurring] Empty state - no items');
        return;
    }

    try {
        const html = recurring.map(item => {
            if (!item || !item.id) {
                console.warn('[Recurring] Skipping invalid item:', item);
                return '';
            }
            
            const nextDueDate = calculateNextDueDate(item.start_date, item.frequency);
            const daysUntilDue = calculateDaysUntilDue(nextDueDate);
            const currencySymbol = getCurrencySymbol(item.currency || 'INR');

            return `
                <div class="recurring-item card-item">
                    <div class="recurring-item-header">
                        <div class="recurring-item-title">
                            <h4>${item.name || 'Unnamed'}</h4>
                            <span class="category-badge">${item.category || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="recurring-item-details">
                        <div class="detail-row">
                            <span class="detail-label">Amount:</span>
                            <span class="detail-value">${currencySymbol}${parseFloat(item.amount || 0).toFixed(2)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Frequency:</span>
                            <span class="detail-value">${item.frequency || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Next Due:</span>
                            <span class="detail-value ${daysUntilDue <= 7 ? 'urgent' : ''}">${nextDueDate} (${daysUntilDue} days)</span>
                        </div>
                    </div>
                    <div class="recurring-item-checkboxes">
                        ${item.category === 'Bills' ? `
                        <div class="checkbox-group">
                            <input type="checkbox" id="recurring-remind-${item.id}" class="checkbox-input" />
                            <label for="recurring-remind-${item.id}" class="checkbox-label">Pause</label>
                        </div>
                        ` : `
                        <div class="checkbox-group">
                            <input type="checkbox" id="recurring-paid-${item.id}" class="checkbox-input" />
                            <label for="recurring-paid-${item.id}" class="checkbox-label">Paid this cycle</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="recurring-pause-${item.id}" class="checkbox-input" />
                            <label for="recurring-pause-${item.id}" class="checkbox-label">Pause expense</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="recurring-remind-${item.id}" class="checkbox-input" />
                            <label for="recurring-remind-${item.id}" class="checkbox-label">Auto-remind me</label>
                        </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        console.log('[Recurring] Rendered successfully');
        
        // Remove any stray checkboxes that are not inside the labeled checkbox area
        document.querySelectorAll('.recurring-item input[type="checkbox"]').forEach(el => {
            if (!el.closest('.recurring-item-checkboxes')) {
                el.parentElement?.removeChild(el);
            }
        });
    } catch (error) {
        console.error('[Recurring] Error rendering items:', error);
        container.innerHTML = '<p class="empty-state">❌ Error rendering recurring expenses</p>';
    }
}

function displaySubscriptions(subscriptions) {
    const container = document.getElementById('subscription-list');
    
    // Safety check: ensure container exists
    if (!container) {
        console.error('[Subscriptions] Container not found in DOM');
        return;
    }
    
    // Validate input - should be array
    if (!Array.isArray(subscriptions)) {
        console.error('[Subscriptions] Invalid input - expected array, got:', typeof subscriptions);
        container.innerHTML = '<p class="empty-state">❌ Invalid data received</p>';
        return;
    }
    
    console.log('[Subscriptions] Rendering', subscriptions.length, 'items');
    
    if (subscriptions.length === 0) {
        container.innerHTML = '<p class="empty-state">📭 No subscriptions yet. Add one to track!</p>';
        console.log('[Subscriptions] Empty state - no items');
        return;
    }

    try {
        const html = subscriptions.map(item => {
            if (!item || !item.id) {
                console.warn('[Subscriptions] Skipping invalid item:', item);
                return '';
            }
            
            const currencySymbol = getCurrencySymbol(item.currency || 'INR');
            const renewalDate = new Date(item.renewal_date);
            const today = new Date();
            const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
            const isUnused = item.last_expense_date === null;

            return `
                <div class="subscription-item card-item ${item.is_paused ? 'paused' : ''}">
                    <div class="subscription-item-header">
                        <div class="subscription-item-title">
                            <h4>${item.service_name || 'Unnamed'}</h4>
                            ${item.is_paused ? '<span class="status-badge paused">Paused</span>' : ''}
                            ${isUnused ? '<span class="status-badge unused">Unused (60+ days)</span>' : ''}
                        </div>
                    </div>
                    <div class="subscription-item-details">
                        <div class="detail-row">
                            <span class="detail-label">Amount:</span>
                            <span class="detail-value">${currencySymbol}${parseFloat(item.amount || 0).toFixed(2)} / ${item.billing_cycle || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Renewal Date:</span>
                            <span class="detail-value ${daysUntilRenewal <= 7 ? 'urgent' : ''}">${item.renewal_date || 'N/A'} (${daysUntilRenewal} days)</span>
                        </div>
                    </div>
                    <div class="subscription-item-checkboxes">
                        <div class="checkbox-group">
                            <input type="checkbox" id="subscription-using-${item.id}" class="checkbox-input" />
                            <label for="subscription-using-${item.id}" class="checkbox-label">${isUnused ? 'Mark as Used' : 'Currently using'}</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="subscription-cancel-${item.id}" class="checkbox-input" />
                            <label for="subscription-cancel-${item.id}" class="checkbox-label">${isUnused ? 'Cancel' : 'Cancel soon'}</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="subscription-renewal-${item.id}" class="checkbox-input" />
                            <label for="subscription-renewal-${item.id}" class="checkbox-label">${isUnused ? 'Delete' : 'Renewal reminder'}</label>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        console.log('[Subscriptions] Rendered successfully');
        
        // Remove any stray checkboxes that are not inside the labeled checkbox area
        document.querySelectorAll('.subscription-item input[type="checkbox"]').forEach(el => {
            if (!el.closest('.subscription-item-checkboxes')) {
                el.parentElement?.removeChild(el);
            }
        });
    } catch (error) {
        console.error('[Subscriptions] Error rendering items:', error);
        container.innerHTML = '<p class="empty-state">❌ Error rendering subscriptions</p>';
    }
}

function updateRecurringStats(recurring) {
    const monthlyTotalElem = document.getElementById('recurring-total-monthly');
    const countElem = document.getElementById('recurring-count');
    
    // Safety checks
    if (!monthlyTotalElem || !countElem) {
        console.error('[Recurring] Stat elements not found in DOM');
        return;
    }
    
    if (!Array.isArray(recurring)) {
        console.error('[Recurring] updateRecurringStats: invalid input type');
        monthlyTotalElem.textContent = '₹0.00';
        countElem.textContent = '0';
        return;
    }
    
    try {
        let monthlyTotal = 0;
        recurring.forEach(item => {
            if (!item || typeof item.amount !== 'number') return;
            
            const freq = item.frequency || '';
            if (freq === 'Monthly') {
                monthlyTotal += item.amount;
            } else if (freq === 'Yearly') {
                monthlyTotal += item.amount / 12;
            } else if (freq === 'Weekly') {
                monthlyTotal += (item.amount * 52) / 12;
            }
        });

        const currencySymbol = getCurrencySymbol('INR');
        monthlyTotalElem.textContent = `${currencySymbol}${monthlyTotal.toFixed(2)}`;
        countElem.textContent = recurring.length;
        console.log('[Recurring] Stats updated: total=', monthlyTotal, 'count=', recurring.length);
    } catch (error) {
        console.error('[Recurring] Error updating stats:', error);
    }
}

function updateSubscriptionStats(data) {
    const totalElem = document.getElementById('subscription-total-monthly');
    const countElem = document.getElementById('subscription-count');
    
    // Safety checks
    if (!totalElem || !countElem) {
        console.error('[Subscriptions] Stat elements not found in DOM');
        return;
    }
    
    if (!data || typeof data !== 'object') {
        console.error('[Subscriptions] updateSubscriptionStats: invalid input type');
        totalElem.textContent = '₹0.00';
        countElem.textContent = '0';
        return;
    }
    
    try {
        const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
        const totalCost = typeof data.total_monthly_cost === 'number' ? data.total_monthly_cost : 0;
        
        const currencySymbol = getCurrencySymbol('INR');
        totalElem.textContent = `${currencySymbol}${totalCost.toFixed(2)}`;
        
        // Count only active (non-paused) subscriptions
        const activeCount = subscriptions.filter(s => !s.is_paused).length;
        countElem.textContent = activeCount;
        
        console.log('[Subscriptions] Stats updated: total=', totalCost, 'active count=', activeCount);
    } catch (error) {
        console.error('[Subscriptions] Error updating stats:', error);
    }
}

async function deleteRecurringExpense(id) {
    if (!confirm('Are you sure you want to delete this recurring expense?')) return;

    try {
        const response = await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showSnackbar('Recurring expense deleted');
            loadRecurringExpenses();
        }
    } catch (error) {
        showSnackbar('Error deleting recurring expense', true);
    }
}

async function deleteSubscription(id) {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
        const response = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showSnackbar('Subscription deleted');
            loadSubscriptions();
        }
    } catch (error) {
        showSnackbar('Error deleting subscription', true);
    }
}

async function toggleSubscriptionPause(id, isPaused) {
    try {
        const response = await fetch(`/api/subscriptions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_paused: isPaused ? 0 : 1 })
        });

        if (response.ok) {
            showSnackbar(isPaused ? 'Subscription resumed' : 'Subscription paused');
            loadSubscriptions();
        }
    } catch (error) {
        showSnackbar('Error updating subscription', true);
    }
}

function editRecurringExpense(id) {
    showSnackbar('Edit functionality coming soon', false);
}

function editSubscription(id) {
    showSnackbar('Edit functionality coming soon', false);
}

function calculateNextDueDate(startDate, frequency) {
    const start = new Date(startDate);
    const today = new Date();
    
    let nextDue = new Date(start);
    
    while (nextDue < today) {
        if (frequency === 'Monthly') {
            nextDue.setMonth(nextDue.getMonth() + 1);
        } else if (frequency === 'Weekly') {
            nextDue.setDate(nextDue.getDate() + 7);
        } else if (frequency === 'Yearly') {
            nextDue.setFullYear(nextDue.getFullYear() + 1);
        }
    }
    
    return nextDue.toISOString().split('T')[0];
}

function calculateDaysUntilDue(dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function getCurrencySymbol(currency) {
    const symbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£'
    };
    return symbols[currency] || currency;
}

function showSnackbar(message, isError = false) {
    const snackbar = document.getElementById('snackbar');
    const snackbarMessage = document.getElementById('snackbar-message');
    snackbarMessage.textContent = message;
    snackbar.classList.remove('hide', 'error', 'success');
    snackbar.classList.add(isError ? 'error' : 'success');
    setTimeout(() => snackbar.classList.add('hide'), 3000);
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });

        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        });
    }
}
