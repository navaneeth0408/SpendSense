// Activity History & Audit Log Management

let allActivities = [];
let filteredActivities = [];
let currentActivityFilter = 'all';
let currentActionFilter = 'all';
let currentSearchQuery = '';
let activityPage = 1;
const itemsPerPage = 50;

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
        
        // Show app section
        const authSection = document.getElementById('auth-section');
        const appSection = document.getElementById('app-section');
        if (authSection) authSection.style.display = 'none';
        if (appSection) appSection.style.display = 'block';
        
        // Load user info
        const data = await response.json();
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = data.preferred_name || data.username || 'User';
        }
        
        // Initialize page
        loadActivityHistory();
        setupActivityFilters();
        setupThemeToggle();
        setupLogout();
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/';
    }
}

async function loadActivityHistory() {
    try {
        const response = await fetch('/api/activity?limit=500');
        if (response.ok) {
            allActivities = await response.json();
            filterAndDisplayActivities();
            loadActivitySummary();
        }
    } catch (error) {
        console.error('Error loading activity history:', error);
        showSnackbar('Error loading activity history', true);
    }
}

async function loadActivitySummary() {
    try {
        const response = await fetch('/api/activity/summary');
        if (response.ok) {
            const summary = await response.json();
            displayActivitySummary(summary);
        }
    } catch (error) {
        console.error('Error loading activity summary:', error);
    }
}

function setupActivityFilters() {
    // Activity type filters
    const typeFilterBtns = document.querySelectorAll('.filter-btn');
    typeFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            typeFilterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentActivityFilter = this.dataset.type;
            activityPage = 1;
            filterAndDisplayActivities();
        });
    });

    // Action type filters
    const actionFilterBtns = document.querySelectorAll('.action-filter-btn');
    actionFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            actionFilterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentActionFilter = this.dataset.action;
            activityPage = 1;
            filterAndDisplayActivities();
        });
    });

    // Search functionality
    const searchBox = document.getElementById('activity-search');
    if (searchBox) {
        searchBox.addEventListener('input', function(e) {
            currentSearchQuery = e.target.value.toLowerCase();
            activityPage = 1;
            filterAndDisplayActivities();
        });
    }

    // Load more button
    const loadMoreBtn = document.getElementById('load-more-activities');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            activityPage++;
            filterAndDisplayActivities(true);
        });
    }
}

function filterAndDisplayActivities(append = false) {
    // Filter activities
    filteredActivities = allActivities.filter(activity => {
        // Type filter
        if (currentActivityFilter !== 'all' && activity.entity_type !== currentActivityFilter) {
            return false;
        }

        // Action filter
        if (currentActionFilter !== 'all' && !activity.action.includes(currentActionFilter)) {
            return false;
        }

        // Search filter
        if (currentSearchQuery) {
            const searchText = `${activity.action} ${activity.entity_type} ${activity.metadata || ''}`.toLowerCase();
            if (!searchText.includes(currentSearchQuery)) {
                return false;
            }
        }

        return true;
    });

    // Display activities with pagination
    displayActivityTimeline(append);
}

function displayActivityTimeline(append = false) {
    const timelineContainer = document.getElementById('activity-timeline');
    const start = (activityPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageActivities = filteredActivities.slice(start, end);

    if (!append) {
        timelineContainer.innerHTML = '';
    }

    if (filteredActivities.length === 0) {
        if (!append) {
            timelineContainer.innerHTML = '<p class="empty-state">No activities found matching your filters</p>';
        }
        return;
    }

    let html = '';
    pageActivities.forEach((activity, index) => {
        const timelineItem = createActivityTimelineItem(activity);
        html += timelineItem;
    });

    if (append) {
        timelineContainer.innerHTML += html;
    } else {
        timelineContainer.innerHTML = html;
    }

    // Update load more button
    const loadMoreBtn = document.getElementById('load-more-activities');
    const noMoreMsg = document.getElementById('no-more-activities');

    if (end < filteredActivities.length) {
        loadMoreBtn.style.display = 'block';
        noMoreMsg.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'none';
        if (filteredActivities.length > itemsPerPage) {
            noMoreMsg.style.display = 'block';
        }
    }
}

function createActivityTimelineItem(activity) {
    const timestamp = new Date(activity.timestamp);
    const timeString = formatTime(timestamp);
    const dateString = formatDate(timestamp);
    const icon = getActivityIcon(activity.action, activity.entity_type);
    const actionText = getActivityActionText(activity.action, activity.entity_type, activity.metadata);
    const entityLabel = getEntityLabel(activity.entity_type);

    return `
        <div class="timeline-item">
            <div class="timeline-dot ${activity.entity_type}">
                ${icon}
            </div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <span class="timeline-action">${actionText}</span>
                    <span class="timeline-entity-type">${entityLabel}</span>
                </div>
                <div class="timeline-metadata">
                    ${activity.metadata ? `<span class="metadata-item">${activity.metadata}</span>` : ''}
                    <span class="timeline-time" title="${dateString} ${timeString}">${formatRelativeTime(timestamp)}</span>
                </div>
            </div>
        </div>
    `;
}

function getActivityIcon(action, entityType) {
    if (action.includes('Created')) return '✨';
    if (action.includes('Updated')) return '✏️';
    if (action.includes('Deleted')) return '🗑️';
    if (action.includes('Login')) return '🔐';
    if (action.includes('Logout')) return '🚪';
    
    switch (entityType) {
        case 'expense': return '💰';
        case 'budget': return '💳';
        case 'category': return '📁';
        case 'recurring_expense': return '🔁';
        case 'subscription': return '🎬';
        case 'settings': return '⚙️';
        default: return '📝';
    }
}

function getActivityActionText(action, entityType, metadata) {
    if (action.includes('Created')) {
        return `Added new ${getEntityLabel(entityType).toLowerCase()}`;
    } else if (action.includes('Updated')) {
        return `Updated ${getEntityLabel(entityType).toLowerCase()}`;
    } else if (action.includes('Deleted')) {
        return `Deleted ${getEntityLabel(entityType).toLowerCase()}`;
    }
    return action;
}

function getEntityLabel(entityType) {
    const labels = {
        'expense': 'Expense',
        'budget': 'Budget',
        'category': 'Category',
        'recurring_expense': 'Recurring Expense',
        'subscription': 'Subscription',
        'settings': 'Settings',
        'user': 'User Account'
    };
    return labels[entityType] || entityType;
}

function displayActivitySummary(summary) {
    const statsGrid = document.getElementById('activity-stats');
    
    // Calculate total activities
    const totalActivities = allActivities.length;
    
    let html = `
        <div class="stat-card">
            <span class="stat-label">Total Activities</span>
            <span class="stat-value">${totalActivities}</span>
        </div>
    `;

    // Add top actions
    if (summary.actions && summary.actions.length > 0) {
        const topAction = summary.actions[0];
        html += `
            <div class="stat-card">
                <span class="stat-label">Most Common Action</span>
                <span class="stat-value">${topAction.action} (${topAction.count})</span>
            </div>
        `;
    }

    // Add entity type with most activities
    if (summary.entities && summary.entities.length > 0) {
        const topEntity = summary.entities[0];
        html += `
            <div class="stat-card">
                <span class="stat-label">Most Tracked</span>
                <span class="stat-value">${getEntityLabel(topEntity.entity_type)}</span>
            </div>
        `;
    }

    statsGrid.innerHTML = html;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(date);
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


