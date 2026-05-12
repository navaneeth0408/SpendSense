// API Helper Functions
const api = {
    async request(url, options = {}) {
        try {
            console.log('[API] Making request to:', url, 'with options:', options);
            const response = await fetch(url, {
                credentials: 'include', // Send and store cookies for session management
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            console.log('[API] Response status:', response.status);
            const data = await response.json();
            console.log('[API] Response data:', data);
            
            if (!response.ok) {
                console.error('[API] Request failed with status', response.status, 'error:', data.error);
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('[API] Request error:', error);
            throw error;
        }
    },
    
    async get(url) {
        return this.request(url, { method: 'GET' });
    },
    
    async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};

// State Management
let currentUser = null;
let editingExpenseId = null;
let currentMonth = new Date().toISOString().slice(0, 7);
let currentYear = new Date().getFullYear();
let selectedYearlyYear = new Date().getFullYear(); // Track separately for yearly summary
let allExpenses = []; // Store all expenses for filtering
let selectedWeekStartDate = null; // Store selected week start date as ISO string to prevent Date mutation issues
let weeklyOriginalCategoryData = {}; // Store original category data for "Other" expansion
// Store yearly aggregation details for "Other" expansion in yearly summary
window.yearlyOriginalCategoryData = window.yearlyOriginalCategoryData || {};
window.yearlyTotalsMap = window.yearlyTotalsMap || {};
let expenseTimeFilter = 'weekly'; // 'weekly', 'monthly'
let quickTimeFilter = 'today'; // 'today', 'week', 'month', 'last-month', 'last-3-months', 'year'
let isLoadingSummary = false;
let expenseSearchQuery = ''; // Store current search query

// DOM Elements - safely get elements, return null if not found
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginFormElement = document.getElementById('loginForm');
const registerFormElement = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const authError = document.getElementById('auth-error');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');
const monthSelect = document.getElementById('month-select');
const yearSelect = document.getElementById('year-select');
const yearlyYearSelect = document.getElementById('yearly-year-select');
const categoryFilter = document.getElementById('category-filter');
const filterWeeklyBtn = document.getElementById('filter-weekly');
const filterMonthlyBtn = document.getElementById('filter-monthly');
const weeklyTotal = document.getElementById('weekly-total');
const weeklyRange = document.getElementById('weekly-range');
const weeklyCategories = document.getElementById('weekly-categories');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');
const summarySection = document.getElementById('summary-section');
const monthlyTotal = document.getElementById('monthly-total');
const categoryBreakdown = document.getElementById('category-breakdown');
const yearlyTotal = document.getElementById('yearly-total');
const yearlyCategoryBreakdown = document.getElementById('yearly-category-breakdown');
const expenseForm = document.getElementById('expense-form');
const formTitle = document.getElementById('form-title');
const expenseIdInput = document.getElementById('expense-id');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const currencySelect = document.getElementById('currency');
const customCategoryInput = document.getElementById('custom-category');
const dateInput = document.getElementById('date');
const notesInput = document.getElementById('notes');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const expensesList = document.getElementById('expenses-list');
const amountErrorElem = document.getElementById('amount-error');
const exportBtn = document.getElementById('export-btn');
const snackbar = document.getElementById('snackbar');
const expenseSearch = document.getElementById('expense-search');
const recurringFrequencySelect = document.getElementById('recurring-frequency');
const categoryTooltip = document.getElementById('category-tooltip');
const monthlyTrend = document.getElementById('monthly-trend');
const weeklyTrend = document.getElementById('weekly-trend');

// New DOM Elements for Advanced Features
const themeToggleBtn = document.getElementById('theme-toggle');
const insightsContent = document.getElementById('insights-content');
const toggleComparisonBtn = document.getElementById('toggle-comparison');
const comparisonContent = document.getElementById('comparison-content');
const compareYear1Select = document.getElementById('compare-year1');
const compareMonth1Select = document.getElementById('compare-month1');
const compareYear2Select = document.getElementById('compare-year2');
const compareMonth2Select = document.getElementById('compare-month2');
const compareBtn = document.getElementById('compare-btn');
const comparisonResults = document.getElementById('comparison-results');
const totalDifference = document.getElementById('total-difference');
const totalPercentage = document.getElementById('total-percentage');
const categoryComparison = document.getElementById('category-comparison');
const snackbarMessage = document.getElementById('snackbar-message');
const snackbarAction = document.getElementById('snackbar-action');

// Budget management
let budgets = {}; // Store budgets data
let pendingDeleteExpenseId = null; // For undo delete functionality

// Global category state - Single source of truth
let globalCategories = {
    predefined: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education'],
    custom: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    if (yearSelect && monthSelect) {
        initializeMonthYearSelectors();
    }
    // Highlight active nav link (if present)
    try{
        const path = window.location.pathname.replace(/\/$/, '');
        document.querySelectorAll('.main-nav .nav-link').forEach(a=>{
            const href = a.getAttribute('href') || '/';
            const h = href.replace(/\/$/, '');
            if(h === path) a.classList.add('active'); else a.classList.remove('active');
        });
    }catch(e){}
});

// Event Listeners
function setupEventListeners() {
    // Auth forms - only on pages with auth section
    if (loginFormElement) loginFormElement.addEventListener('submit', handleLogin);
    if (registerFormElement) registerFormElement.addEventListener('submit', handleRegister);
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    
    // Listen for category updates from settings page
    window.addEventListener('categoriesUpdated', (e) => {
        loadCategoriesFromServer().then(() => {
            // Reload expenses to update dropdown with new categories
            loadExpenses();
        });
    });
    
    // App actions - only on pages with these elements
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (expenseForm) expenseForm.addEventListener('submit', handleExpenseSubmit);
    if (cancelBtn) cancelBtn.addEventListener('click', resetForm);
    if (yearSelect) {
        yearSelect.addEventListener('change', handleMonthYearChange);
    }
    if (monthSelect) {
        monthSelect.addEventListener('change', handleMonthYearChange);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            filterExpenses();
        });
    }
    if (yearlyYearSelect) {
        yearlyYearSelect.addEventListener('change', (e) => {
            selectedYearlyYear = parseInt(e.target.value);
            loadYearlySummary();
        });
    }
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', navigateToPreviousWeek);
    }
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', navigateToNextWeek);
    }
    if (filterWeeklyBtn) {
        filterWeeklyBtn.addEventListener('click', () => setExpenseTimeFilter('weekly'));
    }
    if (filterMonthlyBtn) {
        filterMonthlyBtn.addEventListener('click', () => setExpenseTimeFilter('monthly'));
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }
    
    // Quick Time Filter Event Listeners
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterType = e.target.dataset.quick;
            setQuickTimeFilter(filterType);
        });
    });
    
    if (snackbarAction) {
        snackbarAction.addEventListener('click', handleUndoDelete);
    }
    if (categoryInput) {
        categoryInput.addEventListener('change', (e) => {
            if (e.target.value === 'Other' && customCategoryInput) {
                customCategoryInput.style.display = 'block';
                customCategoryInput.focus();
            } else if (customCategoryInput) {
                customCategoryInput.style.display = 'none';
                customCategoryInput.value = '';
            }
        });
    }
    if (amountInput) {
        amountInput.addEventListener('input', () => clearAmountError());
    }
    
    // Expense search listener
    if (expenseSearch) {
        expenseSearch.addEventListener('input', (e) => {
            expenseSearchQuery = e.target.value.toLowerCase();
            filterExpenses();
        });
    }
}

// Load categories from server and update global state
async function loadCategoriesFromServer() {
    try {
        const response = await api.get('/api/settings/categories');
        if (response && !response.error) {
            globalCategories.custom = response.custom || [];
            // Predefined categories don't change but keep them synced
            globalCategories.predefined = response.predefined || ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education'];
            // Update both dropdowns
            populateExpenseFormCategories();
            return true;
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
    return false;
}

// Populate the expense form category dropdown from global state
function populateExpenseFormCategories() {
    if (!categoryInput) return;
    
    categoryInput.innerHTML = '<option value="">Select Category</option>';
    
    // Add predefined categories
    globalCategories.predefined.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryInput.appendChild(option);
    });
    
    // Add custom categories
    globalCategories.custom.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        categoryInput.appendChild(option);
    });
    
    // Add "Other" option
    const otherOption = document.createElement('option');
    otherOption.value = 'Other';
    otherOption.textContent = 'Other';
    categoryInput.appendChild(otherOption);
}

// Category Filter Functions
// Get all available categories from global state
function getAllCategories() {
    return [...globalCategories.predefined, ...globalCategories.custom.map(c => c.name)];
}

// Helper function to normalize category for display (group non-standard categories as "other")
function normalizeCategoryForDisplay(category) {
    return !globalCategories.predefined.includes(category) ? 'Other' : category;
}

// Helper function to check if a category should be grouped as "Other"
function shouldGroupAsOther(category) {
    return !globalCategories.predefined.includes(category);
}

function populateCategoryFilter(expenses) {
    if (!categoryFilter) return;
    
    // Get unique categories from expenses
    const categories = [...new Set(expenses.map(exp => exp.category))];
    
    // Group categories: predefined ones stay as-is, others grouped as "Other"
    const displayCategories = new Set();
    categories.forEach(category => {
        const displayCategory = normalizeCategoryForDisplay(category);
        displayCategories.add(displayCategory);
    });
    
    // Also include all custom categories from global state
    globalCategories.custom.forEach(cat => displayCategories.add(cat.name));
    
    // Clear existing options except "All Categories"
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    // Add predefined categories first (sorted)
    const sortedPredefined = globalCategories.predefined.filter(cat => displayCategories.has(cat)).sort();
    sortedPredefined.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // Add custom categories
    globalCategories.custom.forEach(cat => {
        if (displayCategories.has(cat.name)) {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            categoryFilter.appendChild(option);
        }
    });
    
    // Add "Other" option if there are any non-standard categories
    if (displayCategories.has('Other')) {
        const option = document.createElement('option');
        option.value = 'Other';
        option.textContent = 'Other';
        categoryFilter.appendChild(option);
    }
}

function filterExpenses() {
    const selectedCategory = categoryFilter.value;
    let filtered = [...allExpenses];
    
    // Apply category filter
    if (selectedCategory) {
        if (selectedCategory === 'Other') {
            // Filter by all non-standard categories grouped as "Other"
            filtered = filtered.filter(exp => shouldGroupAsOther(exp.category));
        } else {
            // Filter by specific predefined category
            filtered = filtered.filter(exp => exp.category === selectedCategory);
        }
    }
    
    // Apply search filter - match against notes, category, and amount
    if (expenseSearchQuery) {
        filtered = filtered.filter(exp => {
            const notes = (exp.notes || '').toLowerCase();
            const category = (exp.category || '').toLowerCase();
            const amount = String(exp.amount);
            
            return notes.includes(expenseSearchQuery) || 
                   category.includes(expenseSearchQuery) || 
                   amount.includes(expenseSearchQuery);
        });
    }
    
    displayExpenses(filtered);
}

function showAmountError(msg) {
    if (amountErrorElem) {
        amountErrorElem.textContent = msg;
        amountErrorElem.style.display = 'block';
    } else {
        alert(msg);
    }
}

function clearAmountError() {
    if (amountErrorElem) {
        amountErrorElem.textContent = '';
        amountErrorElem.style.display = 'none';
    }
}

// Auth Functions
async function checkAuth() {
    console.log('[checkAuth] Checking authentication status');
    try {
        const data = await api.get('/api/check-auth');
        console.log('[checkAuth] Auth check response:', data);
        
        if (data.authenticated) {
            console.log('[checkAuth] User is authenticated:', data.username);
            currentUser = {
                user_id: data.user_id,
                username: data.username,
                preferred_name: data.preferred_name || data.username,
                authenticated: true
            };
            
            // Only show app if we have auth sections (not on pages like settings)
            if (authSection && appSection) {
                console.log('[checkAuth] Showing app (auth sections detected)');
                showApp();
            } else {
                console.log('[checkAuth] Not showing app (no auth sections)');
            }
        } else {
            console.log('[checkAuth] User is not authenticated');
            currentUser = null;
            
            // Only show auth if we have auth sections (not on pages like settings)
            if (authSection && appSection) {
                console.log('[checkAuth] Showing auth (auth sections detected)');
                showAuth();
            } else {
                console.log('[checkAuth] Redirecting to home (no auth sections)');
                // Redirect to home if not authenticated and no auth UI
                window.location.href = '/';
            }
        }
    } catch (error) {
        console.error('[checkAuth] Auth check failed:', error);
        currentUser = null;
        
        // Only show auth if we have auth sections (not on pages like settings)
        if (authSection && appSection) {
            console.log('[checkAuth] Showing auth due to error');
            showAuth();
        } else {
            console.log('[checkAuth] Redirecting to home due to error');
            // Redirect to home if error and no auth UI
            window.location.href = '/';
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    hideError();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    console.log('[Login] Attempting login for user:', username);
    
    if (!username || !password) {
        console.warn('[Login] Missing username or password');
        showError('Please enter both username and password');
        return;
    }
    
    // Disable login button to prevent multiple submissions
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
    }
    
    try {
        console.log('[Login] Sending login request to /api/login');
        const response = await api.post('/api/login', { username, password });
        console.log('[Login] Login successful, response:', response);
        
        // Store user information
        currentUser = {
            username: username,
            user_id: response.user_id,
            authenticated: true
        };
        
        console.log('[Login] Setting currentUser:', currentUser);
        console.log('[Login] Calling showApp()');
        
        // Reset form
        loginFormElement.reset();
        
        // Show dashboard
        showApp();
        
    } catch (error) {
        console.error('[Login] Login error:', error);
        console.error('[Login] Error message:', error.message);
        const errorMsg = error.message || 'Login failed. Please check your credentials.';
        console.error('[Login] Showing error:', errorMsg);
        showError(errorMsg);
    } finally {
        // Re-enable login button
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    hideError();
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    
    console.log('[Register] Attempting registration for user:', username);
    
    if (!username || !password) {
        console.warn('[Register] Missing username or password');
        showError('Please enter both username and password');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    // Disable register button to prevent multiple submissions
    const registerBtn = document.querySelector('#registerForm button[type="submit"]');
    if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Registering...';
    }
    
    try {
        console.log('[Register] Sending registration request to /api/register');
        const response = await api.post('/api/register', { username, password });
        console.log('[Register] Registration successful, response:', response);
        
        // Store user information
        currentUser = {
            username: username,
            user_id: response.user_id,
            authenticated: true
        };
        
        console.log('[Register] Setting currentUser:', currentUser);
        console.log('[Register] Calling showApp()');
        
        // Reset form
        registerFormElement.reset();
        
        // Show dashboard
        showApp();
    } catch (error) {
        console.error('[Register] Registration error:', error);
        console.error('[Register] Error message:', error.message);
        const errorMsg = error.message || 'Registration failed. Please try again.';
        console.error('[Register] Showing error:', errorMsg);
        showError(errorMsg);
    } finally {
        // Re-enable register button
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    }
}

async function handleLogout() {
    console.log('[Logout] Starting logout process');
    try {
        const data = await api.post('/api/logout');
        console.log('[Logout] Server logout response:', data);
        currentUser = null;
        console.log('[Logout] Client state cleared, clearing UI');
        resetForm();
        if (expensesList) {
            expensesList.innerHTML = '';
        }
        if (categoryBreakdown) {
            categoryBreakdown.innerHTML = '';
        }
        console.log('[Logout] UI cleared, showing auth');
        showAuth();
        console.log('[Logout] Logout successful');
    } catch (error) {
        console.error('[Logout] Logout failed:', error);
        // Force logout on client side even if server request fails
        currentUser = null;
        console.log('[Logout] Force logout on client side');
        showAuth();
    }
}

function showAuth() {
    if (authSection) {
        authSection.classList.remove('hidden');
        authSection.style.display = 'flex';
    }
    if (appSection) {
        appSection.style.display = 'none';
    }
}

function showApp() {
    console.log('[showApp] Starting showApp function');
    
    if (authSection) {
        console.log('[showApp] Hiding auth section');
        authSection.classList.add('hidden');
        authSection.style.display = 'none';
    } else {
        console.warn('[showApp] authSection not found!');
    }
    
    if (appSection) {
        console.log('[showApp] Showing app section');
        appSection.style.display = 'block';
    } else {
        console.warn('[showApp] appSection not found!');
    }
    
    if (usernameDisplay) {
        console.log('[showApp] Setting username display:', currentUser?.username);
        usernameDisplay.textContent = currentUser?.username || 'User';
    } else {
        console.warn('[showApp] usernameDisplay not found!');
    }
    
    // Reset category filter
    if (categoryFilter) {
        categoryFilter.value = '';
    }
    
    // Reset week to current week
    selectedWeekStartDate = null;
    
    // Load categories first (single source of truth)
    console.log('[showApp] Loading categories from server');
    loadCategoriesFromServer().then(() => {
        console.log('[showApp] Categories loaded, loading expenses');
        try {
            loadExpenses();
            loadSummary();
            loadBudgets();
            loadWeeklySummary();
            loadYearlySummary();
            console.log('[showApp] All data loaded successfully');
        } catch (error) {
            console.error('[showApp] Error loading data:', error);
        }
    }).catch(error => {
        console.error('[showApp] Failed to load categories:', error);
        // Still try to load expenses even if categories fail
        try {
            loadExpenses();
            loadSummary();
            loadBudgets();
            loadWeeklySummary();
            loadYearlySummary();
        } catch (e) {
            console.error('[showApp] Error loading data after category failure:', e);
        }
    });
    
    // Initialize advanced features
    setupAdvancedFeaturesEventListeners();
    loadInsights(); // Load insights initially
    console.log('[showApp] Setup complete');
}

function showLoginForm() {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    hideError();
}

function showRegisterForm() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    hideError();
}

function showError(message) {
    authError.textContent = message;
    authError.classList.add('show');
}

function hideError() {
    authError.classList.remove('show');
}

// Expense Functions
async function loadExpenses() {
    try {
        let expenses = [];
        
        if (quickTimeFilter) {
            // Handle quick time filters (takes precedence)
            const dateRange = getQuickFilterDateRange(quickTimeFilter);
            const allExpensesData = await api.get('/api/expenses');
            expenses = allExpensesData.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= dateRange.start && expDate <= dateRange.end;
            });
        } else if (expenseTimeFilter === 'weekly') {
            // Load expenses for the selected week
            let weekStart;
            if (selectedWeekStartDate) {
                const dateParts = selectedWeekStartDate.split('-');
                weekStart = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            } else {
                weekStart = getStartOfWeek(new Date());
            }
            const endOfWeek = getEndOfWeek(weekStart);
            const allExpensesData = await api.get('/api/expenses');
            expenses = allExpensesData.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= weekStart && expDate <= endOfWeek;
            });
        } else {
            // Monthly (default)
            const [year, month] = currentMonth.split('-');
            expenses = await api.get(`/api/expenses?year=${year}&month=${month}`);
        }
        
        allExpenses = expenses; // Store all expenses for filtering
        populateCategoryFilter(expenses);
        filterExpenses(); // Apply current filter
    } catch (error) {
        console.error('Failed to load expenses:', error);
        expensesList.innerHTML = '<div class="empty-message">Failed to load expenses</div>';
        allExpenses = [];
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
        }
    }
}

// Set expense time filter
// Set expense time filter
function setExpenseTimeFilter(period) {
    expenseTimeFilter = period;
    quickTimeFilter = null; // Reset quick filter when using time filters
    
    // Update button states
    if (filterWeeklyBtn) filterWeeklyBtn.classList.toggle('active', period === 'weekly');
    if (filterMonthlyBtn) filterMonthlyBtn.classList.toggle('active', period === 'monthly');
    
    // Clear quick filter button states
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Reload expenses with new filter
    loadExpenses();
}

// Set quick time filter
function setQuickTimeFilter(filterType) {
    quickTimeFilter = filterType;
    expenseTimeFilter = null; // Reset time filter when using quick filters
    
    // Update button states
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.quick === filterType);
    });
    
    // Clear time filter button states
    if (filterWeeklyBtn) filterWeeklyBtn.classList.remove('active');
    if (filterMonthlyBtn) filterMonthlyBtn.classList.remove('active');
    
    // Reload expenses with new filter
    loadExpenses();
}

function displayExpenses(expenses) {
    renderExpenses(expenses);
}

async function handleExpenseSubmit(e) {
    e.preventDefault();
    hideError();

    const amountVal = parseFloat(amountInput.value);
    if (isNaN(amountVal) || amountVal <= 0) {
        showAmountError('Amount must be a positive number');
        return;
    }

    let categoryVal = categoryInput.value;
    if (categoryVal === 'Other') {
        categoryVal = customCategoryInput.value.trim();
        if (!categoryVal) {
            alert('Please enter a custom category');
            return;
        }
    }

    const expenseData = {
        amount: amountVal,
        category: categoryVal,
        currency: currencySelect.value || 'INR',
        date: dateInput.value,
        notes: notesInput.value.trim(),
        recurring_frequency: recurringFrequencySelect.value || null  // Add recurrence
    };
    
    try {
        if (editingExpenseId) {
            await api.put(`/api/expenses/${editingExpenseId}`, expenseData);
        } else {
            await api.post('/api/expenses', expenseData);
        }
        
        resetForm();
        await loadExpenses();
        loadSummary();
        loadWeeklySummary();
        loadYearlySummary();
    } catch (error) {
        alert('Failed to save expense: ' + error.message);
    }
}

async function editExpense(id) {
    try {
        const expenses = await api.get('/api/expenses');
        const expense = expenses.find(e => e.id === id);
        
        if (expense) {
            editingExpenseId = expense.id;
            expenseIdInput.value = expense.id;
            amountInput.value = expense.amount;
            // populate category and possibly custom category
            const predefined = ['Food','Transport','Shopping','Bills','Entertainment','Healthcare','Education'];
            if (predefined.includes(expense.category)) {
                categoryInput.value = expense.category;
                customCategoryInput.style.display = 'none';
                customCategoryInput.value = '';
            } else if (expense.category === 'Other') {
                categoryInput.value = 'Other';
                customCategoryInput.style.display = 'block';
                customCategoryInput.value = '';
            } else {
                categoryInput.value = 'Other';
                customCategoryInput.style.display = 'block';
                customCategoryInput.value = expense.category;
            }
            // currency
            currencySelect.value = expense.currency || 'INR';
            dateInput.value = expense.date;
            notesInput.value = expense.notes || '';
            recurringFrequencySelect.value = expense.recurring_frequency || '';  // Load recurrence
            
            formTitle.textContent = 'Edit Expense';
            submitBtn.textContent = 'Update Expense';
            cancelBtn.style.display = 'block';
            
            expenseForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    } catch (error) {
        alert('Failed to load expense: ' + error.message);
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        await api.delete(`/api/expenses/${id}`);
        await loadExpenses();
        loadSummary();
        loadWeeklySummary();
        loadYearlySummary();
    } catch (error) {
        alert('Failed to delete expense: ' + error.message);
    }
}

function resetForm() {
    editingExpenseId = null;
    expenseForm.reset();
    expenseIdInput.value = '';
    formTitle.textContent = 'Add Expense';
    submitBtn.textContent = 'Add Expense';
    cancelBtn.style.display = 'none';
    dateInput.value = new Date().toISOString().slice(0, 10);
    customCategoryInput.style.display = 'none';
    customCategoryInput.value = '';
    currencySelect.value = 'INR';
}

// Store original category data for "Other" expansion
let originalCategoryData = {}; // currency -> { originalCategory -> total }
// Store monthly original-category mapping for "Other" expansion
window.monthlyOriginalCategoryData = window.monthlyOriginalCategoryData || {};

// Summary Functions
async function loadSummary() {
    if (isLoadingSummary) return;
    isLoadingSummary = true;
    
    try {
        if (!monthlyTotal || !categoryBreakdown) return;
        
        // Show loading
        monthlyTotal.innerHTML = '<div class="loading-message">Loading monthly summary…</div>';
        categoryBreakdown.innerHTML = '<div class="loading-message">Loading category breakdown…</div>';
        
        const [year, month] = currentMonth.split('-');
        console.log('Loading summary for', year, month);
        
        const summary = await api.get(`/api/summary?year=${year}&month=${month}`);
        
        displaySummary(summary);
        refreshInsights(); // Load insights when summary updates
        
        // Load monthly trend
        const firstDay = `${year}-${month}-01`;
        loadAndDisplayTrend('monthly-trend', firstDay, 'month');
    } catch (error) {
        console.error('Failed to load summary:', error);
        if (monthlyTotal) monthlyTotal.innerHTML = '<div class="empty-message">Failed to load summary</div>';
        if (categoryBreakdown) categoryBreakdown.innerHTML = '';
    } finally {
        isLoadingSummary = false;
    }
}

function displaySummary(summary) {
    const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    console.log('Displaying summary', summary);

    // Handle empty or unexpected summary
    if (!summary || !summary.totals || (Object.keys(summary.categories || {}).length === 0 && (!summary.totals || summary.totals.length === 0))) {
        monthlyTotal.innerHTML = '<div class="empty-message">No expenses recorded for this month.</div>';
        categoryBreakdown.innerHTML = '<div class="empty-message">No category data available.</div>';
        return;
    }

    // Find primary currency (prefer INR, or first available)
    const totals = summary.totals || [];
    const primaryCurrency = totals.find(t => t.currency === 'INR') ? 'INR' : (totals[0] || {}).currency || 'INR';
    const primaryTotal = totals.find(t => t.currency === primaryCurrency) || { total: 0 };

    // Render total for primary currency
    const sym = currencySymbols[primaryCurrency] || primaryCurrency;
    monthlyTotal.innerHTML = `${sym}${parseFloat(primaryTotal.total).toFixed(2)} <span class="currency-code">${primaryCurrency}</span>`;

    // Build monthlyOriginalCategoryData (group non-predefined categories under 'Other')
    try {
        const monthlyMap = {};
        const cats = summary.categories || {};
        Object.keys(cats).forEach(currency => {
            monthlyMap[currency] = {};
            cats[currency].forEach(entry => {
                const original = entry.category;
                if (shouldGroupAsOther(original)) {
                    if (!monthlyMap[currency]['Other']) monthlyMap[currency]['Other'] = {};
                    monthlyMap[currency]['Other'][original] = (monthlyMap[currency]['Other'][original] || 0) + entry.total;
                } else {
                    monthlyMap[currency][original] = (monthlyMap[currency][original] || 0) + entry.total;
                }
            });
        });
        window.monthlyOriginalCategoryData = monthlyMap;
    } catch (e) { console.error('Failed to build monthly original category map', e); }

    // Render categories with budgets
    renderCategoryBreakdownMonthly(summary);
}

// Toggle category expansion (make globally accessible)
window.toggleCategory = function(categoryId) {
    const subcategories = document.getElementById(`${categoryId}-subcategories`);
    const row = document.querySelector(`[data-category-id="${categoryId}"]`);
    
    if (subcategories && row) {
        subcategories.classList.toggle('expanded');
        row.classList.toggle('expanded');
    }
};

// Month & Year Selector Functions
function initializeMonthYearSelectors() {
    if (!yearSelect || !monthSelect) return;
    
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const currentMonthNum = currentDate.getMonth() + 1;
    
    // Update global currentYear
    currentYear = year;
    
    // Ensure selectedYearlyYear is set to current year (early, before element check)
    selectedYearlyYear = year;
    
    // Populate year selector (current year ± 5 years)
    yearSelect.innerHTML = '';
    for (let y = year - 5; y <= year + 5; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === year) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // Populate month selector
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    monthSelect.innerHTML = '';
    monthNames.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = String(index + 1).padStart(2, '0');
        option.textContent = month;
        if (index + 1 === currentMonthNum) {
            option.selected = true;
        }
        monthSelect.appendChild(option);
    });
    
    // Set initial currentMonth value
    currentMonth = `${year}-${String(currentMonthNum).padStart(2, '0')}`;
    
    // Populate yearly year selector (current year ± 5 years)
    if (yearlyYearSelect) {
        yearlyYearSelect.innerHTML = '';
        for (let y = year - 5; y <= year + 5; y++) {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            if (y === year) {
                option.selected = true;
            }
            yearlyYearSelect.appendChild(option);
        }
        // Initialize selectedYearlyYear
        selectedYearlyYear = year;
    }
}

function handleMonthYearChange() {
    if (!yearSelect || !monthSelect) return;
    
    const year = yearSelect.value;
    const month = monthSelect.value;
    currentMonth = `${year}-${month}`;
    currentYear = parseInt(year);
    
    // Reset weekly navigation when month/year changes
    selectedWeekStartDate = null;
    
    // Update expenses based on current time filter
    loadExpenses();
    loadSummary();
    loadWeeklySummary();  // This will now use today's week
    loadYearlySummary();
    
    // Refresh comparison if it's currently visible
    refreshComparison();
}

// Helper function to get start of week (Monday)
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Calculate the difference to Monday
    // If it's Sunday (0), we want to go back 6 days to Monday
    // If it's Monday (1), we want to go back 0 days
    // If it's Tuesday (2), we want to go back 1 day
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}

// Helper function to get end of week (Saturday)
function getEndOfWeek(startOfWeek) {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
}

// Helper function to get date range for quick filters
function getQuickFilterDateRange(filterType) {
    const now = new Date();
    let start, end;
    
    switch (filterType) {
        case 'today':
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
            
        case 'week':
            start = getStartOfWeek(now);
            end = getEndOfWeek(start);
            break;
            
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            break;
            
        case 'last-month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            end.setHours(23, 59, 59, 999);
            break;
            
        case 'last-3-months':
            start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            break;
            
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            end.setHours(23, 59, 59, 999);
            break;
            
        default:
            // Default to today
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
}

// Week Navigation Functions
function navigateToPreviousWeek() {
    // Get the current selected week start date
    let weekStart;
    if (selectedWeekStartDate) {
        weekStart = new Date(selectedWeekStartDate);
    } else {
        // Initialize to today's week start
        const today = new Date();
        weekStart = getStartOfWeek(today);
    }
    
    // Move back 7 days using a new Date object
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    
    // Store as ISO string to prevent mutation issues
    selectedWeekStartDate = previousWeekStart.toISOString().split('T')[0];
    loadWeeklySummary();
}

function navigateToNextWeek() {
    // Get the current selected week start date
    let weekStart;
    if (selectedWeekStartDate) {
        weekStart = new Date(selectedWeekStartDate);
    } else {
        // Initialize to today's week start
        const today = new Date();
        weekStart = getStartOfWeek(today);
    }
    
    // Move forward 7 days using a new Date object
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    // Store as ISO string to prevent mutation issues
    selectedWeekStartDate = nextWeekStart.toISOString().split('T')[0];
    loadWeeklySummary();
}

// Weekly Summary Functions
async function loadWeeklySummary() {
    try {
        if (!weeklyTotal || !weeklyRange || !weeklyCategories) return;
        
        // Determine which week to show
        let startOfWeek;
        if (selectedWeekStartDate) {
            // User has navigated to a specific week - parse the ISO string
            const dateParts = selectedWeekStartDate.split('-');
            startOfWeek = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            startOfWeek.setHours(0, 0, 0, 0);
        } else {
            // Default to today's week
            const today = new Date();
            startOfWeek = getStartOfWeek(today);
            // Store it for consistency on re-renders
            selectedWeekStartDate = startOfWeek.toISOString().split('T')[0];
        }
        
        const endOfWeek = getEndOfWeek(startOfWeek);
        
        // Format date range
        const formatDateShort = (date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
        if (weeklyRange) {
            weeklyRange.textContent = `${formatDateShort(startOfWeek)} – ${formatDateShort(endOfWeek)}`;
        }
        
        // Update navigation button states
        const todayDate = new Date();
        const currentWeekStartDate = getStartOfWeek(todayDate);
        
        if (prevWeekBtn) {
            prevWeekBtn.disabled = false; // Can always go back
        }
        if (nextWeekBtn) {
            // Disable if trying to go beyond current week
            const nextWeek = new Date(startOfWeek);
            nextWeek.setDate(startOfWeek.getDate() + 7);
            nextWeekBtn.disabled = nextWeek > currentWeekStartDate;
        }
        
        // Fetch all expenses and filter by week
        const allExpensesData = await api.get('/api/expenses');
        const weeklyExpenses = allExpensesData.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= startOfWeek && expDate <= endOfWeek;
        });
        
        // Calculate totals by currency
        const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
        const totalsByCurrency = {};
        const categoryTotalsByCurrency = {};
        
        // Store original category data for "Other" expansion
        weeklyOriginalCategoryData = {};
        
        
        weeklyExpenses.forEach(exp => {
            const cur = exp.currency || 'INR';
            const amt = parseFloat(exp.amount) || 0;
            const originalCat = exp.category;
            const displayCat = normalizeCategoryForDisplay(originalCat);
            
            totalsByCurrency[cur] = (totalsByCurrency[cur] || 0) + amt;
            
            if (!categoryTotalsByCurrency[cur]) categoryTotalsByCurrency[cur] = {};
            categoryTotalsByCurrency[cur][displayCat] = (categoryTotalsByCurrency[cur][displayCat] || 0) + amt;
            
            // Store original category data for "Other" expansion
            if (!weeklyOriginalCategoryData[cur]) weeklyOriginalCategoryData[cur] = {};
            if (shouldGroupAsOther(originalCat)) {
                if (!weeklyOriginalCategoryData[cur]['Other']) weeklyOriginalCategoryData[cur]['Other'] = {};
                weeklyOriginalCategoryData[cur]['Other'][originalCat] = (weeklyOriginalCategoryData[cur]['Other'][originalCat] || 0) + amt;
            } else {
                weeklyOriginalCategoryData[cur][originalCat] = (weeklyOriginalCategoryData[cur][originalCat] || 0) + amt;
            }
        });
        
        // Display totals (show first currency or primary)
        const primaryCurrency = Object.keys(totalsByCurrency)[0] || 'INR';
        const sym = currencySymbols[primaryCurrency] || primaryCurrency;
        const total = totalsByCurrency[primaryCurrency] || 0;
        if (weeklyTotal) {
            weeklyTotal.innerHTML = `${sym}${total.toFixed(2)} <span class="currency-code">${primaryCurrency}</span>`;
        }
        
        // Display all categories with expandable "Other"
        const categories = categoryTotalsByCurrency[primaryCurrency] || {};
        const allCategories = Object.keys(categories)
            .map(cat => ({ name: cat, total: categories[cat] }))
            .sort((a, b) => b.total - a.total);
        
        if (allCategories.length === 0) {
            if (weeklyCategories) {
                weeklyCategories.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 13px;">No expenses this week</div>';
            }
        } else {
            if (weeklyCategories) {
                weeklyCategories.innerHTML = allCategories.map((cat, index) => {
                    const isOther = cat.name === 'Other';
                    const hasSubcategories = isOther && weeklyOriginalCategoryData[primaryCurrency] && 
                                           weeklyOriginalCategoryData[primaryCurrency]['Other'] && 
                                           Object.keys(weeklyOriginalCategoryData[primaryCurrency]['Other']).length > 0;
                    const categoryId = `weekly-category-${index}`;
                    
                    let rowHtml = `
                        <div class="weekly-category-item ${hasSubcategories ? 'expandable' : ''}" 
                             ${hasSubcategories ? `onclick="toggleWeeklyCategory('${categoryId}')"` : ''}
                             data-category-id="${categoryId}">
                            <span class="weekly-category-name">${escapeHtml(cat.name)}</span>
                            <span class="weekly-category-amount">${sym}${parseFloat(cat.total).toFixed(2)}</span>
                            ${hasSubcategories ? '<svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>' : ''}
                        </div>
                    `;
                    
                    // Add subcategories for "Other" category
                    if (hasSubcategories) {
                        const subcategories = weeklyOriginalCategoryData[primaryCurrency]['Other'];
                        const subcategoryList = Object.keys(subcategories)
                            .map(subcat => ({
                                name: subcat,
                                total: subcategories[subcat]
                            }))
                            .sort((a, b) => b.total - a.total);
                        
                        rowHtml += `
                            <div class="weekly-subcategories" id="${categoryId}-subcategories">
                                ${subcategoryList.map(subcat => `
                                    <div class="weekly-subcategory-item">
                                        <span class="weekly-subcategory-name">${escapeHtml(subcat.name)}</span>
                                        <span class="weekly-subcategory-amount">${sym}${parseFloat(subcat.total).toFixed(2)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    }
                    
                    return rowHtml;
                }).join('');
            }
        }
        
        // Load weekly trend
        const weekStartStr = startOfWeek.toISOString().slice(0, 10);
        loadAndDisplayTrend('weekly-trend', weekStartStr, 'week');
    } catch (error) {
        console.error('Failed to load weekly summary:', error);
        // Display safe fallback values instead of error messages
        if (weeklyTotal) {
            const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
            const userCurrency = document.getElementById('currency')?.value || 'INR';
            const sym = currencySymbols[userCurrency] || userCurrency;
            weeklyTotal.innerHTML = `${sym}0.00 <span class="currency-code">${userCurrency}</span>`;
        }
        if (weeklyRange) {
            const formatDateShort = (date) => {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            };
            const today = new Date();
            const errorStartOfWeek = getStartOfWeek(today);
            const errorEndOfWeek = getEndOfWeek(errorStartOfWeek);
            weeklyRange.textContent = `${formatDateShort(errorStartOfWeek)} – ${formatDateShort(errorEndOfWeek)}`;
        }
        if (weeklyCategories) weeklyCategories.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 13px;">No expenses this week</div>';
    }
}

// Toggle weekly category expansion (make globally accessible)
window.toggleWeeklyCategory = function(categoryId) {
    const subcategories = document.getElementById(`${categoryId}-subcategories`);
    const row = document.querySelector(`[data-category-id="${categoryId}"]`);
    
    if (subcategories && row) {
        subcategories.classList.toggle('expanded');
        row.classList.toggle('expanded');
    }
};

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Yearly Summary Functions
async function loadYearlySummary() {
    try {
        if (!yearlyTotal || !yearlyCategoryBreakdown) return;
        
        const year = selectedYearlyYear || currentYear;
        console.log('[loadYearlySummary] Loading data for year:', year, 'type:', typeof year);
        
        // Fetch all expenses for the year - ensure year is a string
        const yearStr = String(year);
        console.log('[loadYearlySummary] API call to:', `/api/expenses?year=${yearStr}`);
        const expenses = await api.get(`/api/expenses?year=${yearStr}`);
        
        // Compute totals grouped by currency
        const totalsMap = {};
        const categoryTotals = {};
        const yearlyOriginalCategoryData = {};
        
        expenses.forEach(exp => {
            const cur = exp.currency || 'INR';
            const amt = parseFloat(exp.amount) || 0;
            const originalCat = exp.category;
            const displayCat = normalizeCategoryForDisplay(originalCat);
            
            totalsMap[cur] = (totalsMap[cur] || 0) + amt;
            
            if (!categoryTotals[cur]) categoryTotals[cur] = {};
            categoryTotals[cur][displayCat] = (categoryTotals[cur][displayCat] || 0) + amt;
            
            // Store original category data for "Other" expansion
            if (!yearlyOriginalCategoryData[cur]) yearlyOriginalCategoryData[cur] = {};
            if (shouldGroupAsOther(originalCat)) {
                if (!yearlyOriginalCategoryData[cur]['Other']) yearlyOriginalCategoryData[cur]['Other'] = {};
                yearlyOriginalCategoryData[cur]['Other'][originalCat] = (yearlyOriginalCategoryData[cur]['Other'][originalCat] || 0) + amt;
            } else {
                yearlyOriginalCategoryData[cur][originalCat] = (yearlyOriginalCategoryData[cur][originalCat] || 0) + amt;
            }
        });
        
        const totals = Object.keys(totalsMap).map(c => ({ currency: c, total: totalsMap[c] }));
        const categories = {};
        Object.keys(categoryTotals).forEach(currency => {
            categories[currency] = Object.keys(categoryTotals[currency]).map(category => ({
                category: category,
                total: categoryTotals[currency][category]
            })).sort((a, b) => b.total - a.total);
        });
        
        // Store yearly original category details for 'Other' expansion and totals map
        window.yearlyOriginalCategoryData = yearlyOriginalCategoryData;
        window.yearlyTotalsMap = totalsMap;

        // Update yearly title with selected year
        const yearlyTitle = document.getElementById('yearly-title');
        if (yearlyTitle) {
            yearlyTitle.textContent = `Yearly Summary`;
        }
        
        displayYearlySummary({ totals, categories }, yearlyOriginalCategoryData);
    } catch (error) {
        console.error('[loadYearlySummary] Failed to load yearly summary:', error);
        console.error('[loadYearlySummary] Error message:', error.message);
        console.error('[loadYearlySummary] Error stack:', error.stack);
        if (yearlyTotal) {
            const errorMsg = error.message || 'Failed to load summary';
            yearlyTotal.innerHTML = `<div class="empty-message">${escapeHtml(errorMsg)}</div>`;
        }
        if (yearlyCategoryBreakdown) yearlyCategoryBreakdown.innerHTML = '';
    }
}

function displayYearlySummary(summary, originalCategoryData) {
    const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    
    if (!summary || !summary.totals || (Object.keys(summary.categories || {}).length === 0 && (!summary.totals || summary.totals.length === 0))) {
        if (yearlyTotal) yearlyTotal.innerHTML = '<div class="empty-message">No expenses for this year</div>';
        if (yearlyCategoryBreakdown) yearlyCategoryBreakdown.innerHTML = '<div class="empty-message">No category data</div>';
        return;
    }
    
    // Render totals per currency
    if (summary.totals && summary.totals.length > 0) {
        if (yearlyTotal) {
            yearlyTotal.innerHTML = summary.totals.map(t => {
                const sym = currencySymbols[t.currency] || t.currency;
                return `<div class="total-line">${sym}${parseFloat(t.total).toFixed(2)} <span class="currency-code">${t.currency}</span></div>`;
            }).join('');
        }
    } else {
        if (yearlyTotal) yearlyTotal.innerHTML = '<div class="empty-message">No total available</div>';
    }
    
    // Render categories (yearly doesn't show budgets)
    renderCategoryBreakdownYearly(summary);
}

// Set default date to today
dateInput.value = new Date().toISOString().slice(0, 10);

// Utility Functions
function getCurrencySymbol(currency) {
    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    return symbols[currency] || currency;
}

// Budget Management Functions
async function loadBudgets() {
    try {
        const data = await api.get('/api/budgets');
        budgets = {};
        data.forEach(budget => {
            budgets[budget.category] = {
                limit: parseFloat(budget.monthly_limit),
                currency: budget.currency
            };
        });
    } catch (error) {
        console.error('Failed to load budgets:', error);
    }
}

async function setBudget(category, limit, currency) {
    try {
        await api.post('/api/budgets', { category, monthly_limit: limit, currency });
        budgets[category] = { limit: parseFloat(limit), currency };
        // Refresh summary to show updated budget info
        loadSummary();
        loadWeeklySummary();
        loadYearlySummary();
    } catch (error) {
        console.error('Failed to set budget:', error);
        alert('Failed to set budget. Please try again.');
    }
}

function showBudgetDialog(category, currentTotal, currency) {
    const currentBudget = budgets[category];
    const currentLimit = currentBudget ? currentBudget.limit : '';
    
    const limit = prompt(`Set monthly budget for ${category} (${currency}):`, currentLimit);
    if (limit === null) return; // Cancelled
    
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0) {
        alert('Please enter a valid positive number for the budget limit.');
        return;
    }
    
    setBudget(category, numLimit, currency);
}

// Export Functions
async function handleExport() {
    try {
        const year = yearSelect.value;
        const month = monthSelect.value;
        const category = categoryFilter.value;
        const period = expenseTimeFilter;
        
        let url = `/api/expenses/export?year=${year}&period=${period}`;
        if (month) url += `&month=${month}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `spendsense_expenses_${year}_${month || 'all'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export expenses. Please try again.');
    }
}

// Undo Delete Functions
function showSnackbar(message, actionText, actionCallback, duration = 5000) {
    if (!snackbar || !snackbarMessage || !snackbarAction) return; // Snackbar not on this page
    
    snackbarMessage.textContent = message;
    snackbarAction.textContent = actionText;
    
    // Remove previous event listener
    const newActionBtn = snackbarAction.cloneNode(true);
    snackbarAction.parentNode.replaceChild(newActionBtn, snackbarAction);
    
    // Add new event listener
    newActionBtn.addEventListener('click', actionCallback);
    
    snackbar.classList.remove('hide');
    
    // Auto hide after duration
    setTimeout(() => {
        hideSnackbar();
    }, duration);
}

function hideSnackbar() {
    if (!snackbar) return;
    snackbar.classList.add('hide');
}

async function handleUndoDelete() {
    if (!pendingDeleteExpenseId) return;
    
    try {
        await api.post(`/api/expenses/${pendingDeleteExpenseId}/undo-delete`);
        hideSnackbar();
        // Refresh data
        loadExpenses();
        loadSummary();
        loadWeeklySummary();
        loadYearlySummary();
        pendingDeleteExpenseId = null;
    } catch (error) {
        console.error('Failed to undo delete:', error);
        alert('Failed to restore expense. Please refresh the page.');
    }
}

// Update expense rendering to include budget progress
function renderCategoryBreakdown(categoriesByCurrency, container, showBudgets = true) {
    if (!container) return;
    
    let html = '';
    
    Object.keys(categoriesByCurrency).forEach(currency => {
        const sym = getCurrencySymbol(currency);
        const categories = categoriesByCurrency[currency];
        
        html += `<div class="currency-group">
            <h4>${currency} Expenses</h4>
            <div class="category-list">`;
        
        categories.forEach((cat, idx) => {
            const category = cat.category;
            const categoryId = `${currency.replace(/[^a-zA-Z0-9]/g,'')}-cat-${idx}`;
            const total = cat.total;
            const budget = cat.budget_limit;
            const percentage = cat.budget_percentage;
            
            const isOther = category === 'Other';
            const hasSubcategories = isOther && window.monthlyOriginalCategoryData && window.monthlyOriginalCategoryData[currency] && window.monthlyOriginalCategoryData[currency]['Other'] && Object.keys(window.monthlyOriginalCategoryData[currency]['Other']).length > 0;

            html += `
                <div class="category-item ${hasSubcategories ? 'expandable' : ''}" data-category-id="${categoryId}" ${hasSubcategories ? `onclick="toggleCategory('${categoryId}')"` : `onclick="showCategoryInsight('${escapeHtml(category)}','${currency}')"`} style="cursor: pointer;" title="Click for insights">
                    <div class="category-name">${escapeHtml(category)}</div>
                    <div class="category-total">${sym}${total.toFixed(2)}</div>`;
            
            if (showBudgets && budget) {
                const progressClass = percentage > 100 ? 'exceeded' : percentage > 80 ? 'warning' : 'normal';
                
                html += `
                    <div class="category-budget">
                        <div class="budget-info">
                            <span class="budget-text">Budget: ${sym}${budget.toFixed(2)} | Spent: ${sym}${total.toFixed(2)}</span>
                        </div>
                        <div class="budget-progress">
                            <div class="budget-bar ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <div class="budget-info">
                            <span class="budget-percentage">${percentage.toFixed(1)}% used</span>
                            <span class="budget-edit" onclick="event.stopPropagation(); showBudgetDialog('${escapeHtml(category)}', ${total}, '${currency}')">Edit</span>
                        </div>
                    </div>`;
            } else if (showBudgets) {
                html += `
                    <div class="category-budget">
                        <div class="budget-info">
                            <span class="budget-edit" onclick="event.stopPropagation(); showBudgetDialog('${escapeHtml(category)}', ${total}, '${currency}')">Set Budget</span>
                        </div>
                    </div>`;
            }
            
            // Add subcategories block for 'Other' (monthly)
            if (hasSubcategories) {
                const subMap = window.monthlyOriginalCategoryData[currency]['Other'];
                const subList = Object.keys(subMap).map(sub => ({ name: sub, total: subMap[sub] })).sort((a,b)=>b.total-a.total);

                html += `
                    <div class="subcategories" id="${categoryId}-subcategories">
                        ${subList.map(sub => `
                            <div class="sub-item">
                                <div class="sub-name">${escapeHtml(sub.name)}</div>
                                <div class="sub-total">${sym}${parseFloat(sub.total).toFixed(2)}</div>
                                <div class="sub-actions"><button onclick="event.stopPropagation(); showBudgetDialog('${escapeHtml(sub.name)}', ${sub.total}, '${currency}')">Set Budget</button></div>
                            </div>
                        `).join('')}
                    </div>`;
            }

            html += '</div>';
        });
        
        html += '</div></div>';
    });
    
    container.innerHTML = html;
}

// Update the existing renderCategoryBreakdownMonthly to use the new function
function renderCategoryBreakdownMonthly(data) {
    renderCategoryBreakdown(data.categories, categoryBreakdown, true);
}

// Update renderCategoryBreakdownYearly to use the new function
function renderCategoryBreakdownYearly(data) {
    renderCategoryBreakdown(data.categories, yearlyCategoryBreakdown, false);
}

// Update expense deletion to use soft delete
async function deleteExpense(expenseId) {
    try {
        const response = await api.delete(`/api/expenses/${expenseId}`);
        if (response.deleted) {
            pendingDeleteExpenseId = expenseId;
            showSnackbar('Expense deleted', 'Undo', handleUndoDelete, 10000); // 10 seconds
            
            // Auto-delete after 10 seconds if not undone
            setTimeout(async () => {
                if (pendingDeleteExpenseId === expenseId) {
                    pendingDeleteExpenseId = null;
                    // Expense is already soft-deleted, no need for additional action
                }
            }, 10000);
        }
        
        // Refresh data immediately
        loadExpenses();
        loadSummary();
        loadWeeklySummary();
        loadYearlySummary();
    } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense. Please try again.');
    }
}

// Update renderExpenses to show empty state
function renderExpenses(expenses) {
    if (!expensesList) return;

    if (!expenses || expenses.length === 0) {
        expensesList.innerHTML = '<div class="empty-message">No expenses recorded for this period.</div>';
        return;
    }

    // Group expenses by date
    const expensesByDate = {};
    expenses.forEach(expense => {
        const date = new Date(expense.date).toLocaleDateString();
        if (!expensesByDate[date]) {
            expensesByDate[date] = [];
        }
        expensesByDate[date].push(expense);
    });

    // Sort dates in descending order (most recent first)
    const sortedDates = Object.keys(expensesByDate).sort((a, b) => new Date(b) - new Date(a));

    let html = '';
    sortedDates.forEach(date => {
        const dateExpenses = expensesByDate[date];
        const totalForDate = dateExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const currencySymbol = getCurrencySymbol(dateExpenses[0].currency);

        html += `
            <div class="date-group">
                <div class="date-header">
                    <span class="date-title">${date}</span>
                    <span class="date-total">${currencySymbol}${totalForDate.toFixed(2)}</span>
                </div>
                <div class="date-expenses">
        `;

        dateExpenses.forEach(expense => {
            html += `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="amount">${currencySymbol}${parseFloat(expense.amount).toFixed(2)}</div>
                        <div class="expense-details">
                            <div class="category">
                                ${escapeHtml(expense.category)}
                            </div>
                            ${expense.notes ? `<div class="notes">${escapeHtml(expense.notes)}</div>` : ''}
                        </div>
                    </div>
                    <div class="expense-actions">
                        <button class="icon-btn edit" onclick="editExpense(${expense.id})" title="Edit expense">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="icon-btn delete" onclick="deleteExpense(${expense.id})" title="Delete expense">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    expensesList.innerHTML = html;
}

// Advanced Features Functions

// Dark Mode Functions
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
    const icon = themeToggleBtn.querySelector('.theme-icon');
    if (theme === 'dark') {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
    } else {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
    }
}

// Spending Insights Functions
async function loadInsights() {
    try {
        const [year, month] = currentMonth.split('-');
        const response = await api.get(`/api/insights?month=${month}&year=${year}`);
        renderInsights(response.insights);
    } catch (error) {
        console.error('Error loading insights:', error);
        insightsContent.innerHTML = '<div class="insight-loading">Unable to load insights</div>';
    }
}

function renderInsights(insights) {
    if (!insights || insights.length === 0) {
        insightsContent.innerHTML = '<div class="insight-loading">Not enough data to generate insights yet. Add more expenses to see spending patterns.</div>';
        return;
    }

    const html = insights.map(insight => `
        <div class="insight-item">
            <div class="insight-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div class="insight-text">${escapeHtml(insight)}</div>
        </div>
    `).join('');

    insightsContent.innerHTML = html;
}

// Monthly Comparison Functions
function initMonthlyComparison() {
    populateComparisonSelectors();
}

function populateComparisonSelectors() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Populate year selectors
    [compareYear1Select, compareYear2Select].forEach(select => {
        select.innerHTML = '';
        for (let year = currentYear; year >= currentYear - 5; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    });
    
    // Populate month selectors
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    [compareMonth1Select, compareMonth2Select].forEach(select => {
        select.innerHTML = '';
        monthNames.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = (index + 1).toString().padStart(2, '0');
            option.textContent = month;
            select.appendChild(option);
        });
    });
    
    // Set default values (current month vs previous month)
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const prevMonth = currentDate.getMonth() === 0 ? '12' : (currentDate.getMonth()).toString().padStart(2, '0');
    const prevMonthYear = currentDate.getMonth() === 0 ? currentYear - 1 : currentYear;
    
    compareYear1Select.value = prevMonthYear;
    compareMonth1Select.value = prevMonth;
    compareYear2Select.value = currentYear;
    compareMonth2Select.value = currentMonth;
}

async function performComparison() {
    const year1 = compareYear1Select.value;
    const month1 = compareMonth1Select.value;
    const year2 = compareYear2Select.value;
    const month2 = compareMonth2Select.value;
    
    if (!year1 || !month1 || !year2 || !month2) {
        alert('Please select both months for comparison');
        return;
    }
    
    try {
        const response = await api.get(`/api/month-comparison?year1=${year1}&month1=${month1}&year2=${year2}&month2=${month2}`);
        // attach readable month names for header labels
        const monthNames = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];
        response.month1Name = monthNames[parseInt(month1, 10) - 1];
        response.month2Name = monthNames[parseInt(month2, 10) - 1];
        renderComparisonResults(response);
    } catch (error) {
        console.error('Error performing comparison:', error);
        alert('Error loading comparison data');
    }
}

function renderComparisonResults(data) {
    const currencySymbol = getCurrencySymbol('INR'); // Default to INR for now
    
    // Total difference
    const diff = data.total_difference;
    const pct = data.total_percentage_change;
    
    totalDifference.textContent = `${diff >= 0 ? '+' : ''}${currencySymbol}${Math.abs(diff).toFixed(2)}`;
    totalDifference.className = `difference-amount ${diff >= 0 ? 'positive' : 'negative'}`;
    
    totalPercentage.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    totalPercentage.className = `percentage-change ${pct >= 0 ? 'positive' : 'negative'}`;
    
    // header labels row
    const headerHtml = `
        <div class="comparison-labels">
            <div class="comparison-label category-label"></div>
            <div class="comparison-label month1-label">${escapeHtml(data.month1Name || '')}</div>
            <div class="comparison-label month2-label">${escapeHtml(data.month2Name || '')}</div>
            <div class="comparison-label diff-label">Difference</div>
        </div>
    `;

    // Category comparison
    const html = data.categories.map(cat => {
        const trendIcon = cat.trend === 'up' ? 
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>' :
            cat.trend === 'down' ?
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>' :
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" /></svg>';
        
        return `
            <div class="category-compare-item">
                <div class="category-compare-name">${escapeHtml(cat.category)}</div>
                <div class="category-amount previous">${currencySymbol}${cat.amount1.toFixed(2)}</div>
                <div class="category-amount current">${currencySymbol}${cat.amount2.toFixed(2)}</div>
                <div class="category-difference">
                    <span class="trend-icon ${cat.trend}">${trendIcon}</span>
                    <span class="difference-text ${cat.difference >= 0 ? 'positive' : 'negative'}">
                        ${cat.difference >= 0 ? '+' : ''}${currencySymbol}${Math.abs(cat.difference).toFixed(2)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    categoryComparison.innerHTML = headerHtml + html;
    comparisonResults.style.display = 'block';
}

function toggleComparisonSection() {
    const isVisible = comparisonContent.style.display !== 'none';
    comparisonContent.style.display = isVisible ? 'none' : 'block';
    toggleComparisonBtn.classList.toggle('rotated', !isVisible);
    
    if (!isVisible) {
        // Initialize selectors when opening
        populateComparisonSelectors();
    }
}

// Smart Category Suggestion Functions
const categoryKeywords = {
    'Food': ['food', 'pizza', 'burger', 'rice', 'lunch', 'dinner', 'cafe', 'coffee', 'restaurant', 'meal', 'snack', 'groceries', 'supermarket', 'eat', 'drink'],
    'Transport': ['bus', 'train', 'uber', 'ola', 'taxi', 'fuel', 'petrol', 'auto', 'metro', 'flight', 'plane', 'ticket', 'travel', 'parking', 'toll'],
    'Education': ['college', 'course', 'fee', 'exam', 'book', 'tuition', 'school', 'university', 'class', 'study', 'learning', 'online course'],
    'Entertainment': ['netflix', 'movie', 'cinema', 'game', 'spotify', 'music', 'concert', 'party', 'event', 'fun', 'gaming', 'theater'],
    'Shopping': ['amazon', 'flipkart', 'clothes', 'shoes', 'mall', 'shopping', 'store', 'market', 'buy', 'purchase', 'shirt', 'pants', 'bag', 'watch', 'jewelry'],
    'Bills': ['bill', 'electricity', 'water', 'gas', 'internet', 'phone', 'mobile', 'rent', 'utility', 'subscription', 'service'],
    'Healthcare': ['doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'health', 'clinic', 'treatment', 'checkup', 'insurance'],
    'Other': [] // Default fallback
};

function suggestCategory(notes) {
    if (!notes || notes.trim() === '') return null;
    
    const lowerNotes = notes.toLowerCase();
    let bestMatch = null;
    let maxMatches = 0;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        let matches = 0;
        for (const keyword of keywords) {
            if (lowerNotes.includes(keyword)) {
                matches++;
            }
        }
        
        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = category;
        }
    }
    
    return maxMatches > 0 ? bestMatch : null;
}

function updateCategorySuggestion() {
    const notes = notesInput.value;
    const suggestedCategory = suggestCategory(notes);
    
    if (suggestedCategory && categoryInput.value === '') {
        categoryInput.value = suggestedCategory;
        // Trigger change event to handle custom category logic
        categoryInput.dispatchEvent(new Event('change'));
    }
}

// Event Listeners for Advanced Features
function setupAdvancedFeaturesEventListeners() {
    // Dark Mode
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Monthly Comparison
    toggleComparisonBtn.addEventListener('click', toggleComparisonSection);
    compareBtn.addEventListener('click', performComparison);
    
    // Smart Category Suggestion
    notesInput.addEventListener('input', updateCategorySuggestion);
    
    // Initialize Quick Time Filters
    setQuickTimeFilter('today');
}

// Initialize advanced features
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initMonthlyComparison();
});

// Update insights when data changes
function refreshInsights() {
    if (currentUser) {
        loadInsights();
    }
}

// Update comparison when month/year changes
function refreshComparison() {
    if (comparisonResults.style.display !== 'none') {
        performComparison();
    }
}

// Category Insight Tooltip Functions
async function showCategoryInsight(category, currency) {
    try {
        // If 'Other' was clicked in a yearly summary, we may have precomputed original-category data
        if (category === 'Other' && currency && window.yearlyOriginalCategoryData && window.yearlyOriginalCategoryData[currency]) {
            const otherMap = window.yearlyOriginalCategoryData[currency]['Other'] || {};
            const totalSpent = Object.values(otherMap).reduce((s, v) => s + v, 0);

            const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
            const sym = currencySymbols[currency] || currency;

            const percentageOfTotal = window.yearlyTotalsMap && window.yearlyTotalsMap[currency] ? (totalSpent / window.yearlyTotalsMap[currency] * 100) : 100;
            const avgPerDay = totalSpent / 365;

            document.getElementById('tooltip-category-name').textContent = 'Other (multiple categories)';
            document.getElementById('tooltip-total-spent').textContent = `${sym}${totalSpent.toFixed(2)}`;
            document.getElementById('tooltip-percentage').textContent = `${percentageOfTotal.toFixed(1)}%`;
            document.getElementById('tooltip-avg-per-day').textContent = `${sym}${avgPerDay.toFixed(2)}/day`;

            // Hide budget row for aggregated 'Other'
            const budgetRow = document.getElementById('tooltip-budget-row');
            if (budgetRow) budgetRow.style.display = 'none';

            // Show tooltip
            if (categoryTooltip) categoryTooltip.style.display = 'block';
            return;
        }

        const [year, month] = currentMonth.split('-');
        const response = await api.get(`/api/category-insights?category=${encodeURIComponent(category)}&month=${month}&year=${year}`);
        
        // Populate tooltip
        const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
        const sym = currencySymbols[response.budget_currency] || response.budget_currency;
        
        document.getElementById('tooltip-category-name').textContent = response.category;
        document.getElementById('tooltip-total-spent').textContent = `${sym}${response.total_spent.toFixed(2)}`;
        document.getElementById('tooltip-percentage').textContent = `${response.percentage_of_total.toFixed(1)}%`;
        document.getElementById('tooltip-avg-per-day').textContent = `${sym}${response.average_per_day.toFixed(2)}/day`;
        
        // Show budget remaining if exists
        const budgetRow2 = document.getElementById('tooltip-budget-row');
        if (response.budget_limit !== null) {
            budgetRow2.style.display = 'block';
            const remaining = response.budget_remaining;
            const remainingText = remaining >= 0 ? `${sym}${remaining.toFixed(2)}` : `-${sym}${Math.abs(remaining).toFixed(2)}`;
            document.getElementById('tooltip-budget-remaining').textContent = remainingText;
        } else {
            budgetRow2.style.display = 'none';
        }
        
        // Show tooltip
        if (categoryTooltip) categoryTooltip.style.display = 'block';
    } catch (error) {
        console.error('Failed to load category insights:', error);
    }
}

function closeCategoryTooltip() {
    if (categoryTooltip) {
        categoryTooltip.style.display = 'none';
    }
}

// Spending Trend Functions
async function loadAndDisplayTrend(elementId, startDate, period) {
    try {
        const response = await api.get(`/api/spending-trends?start_date=${startDate}&period=${period}`);
        const trendElement = document.getElementById(elementId);
        
        if (!trendElement) return;
        
        const pct = Math.abs(response.percentage_change);
        const direction = response.direction;
        
        if (direction === 'up') {
            trendElement.innerHTML = `<span class="trend-up">↑ ${pct.toFixed(1)}% vs last ${period}</span>`;
        } else if (direction === 'down') {
            trendElement.innerHTML = `<span class="trend-down">↓ ${pct.toFixed(1)}% vs last ${period}</span>`;
        } else {
            trendElement.innerHTML = `<span class="trend-neutral">→ No change vs last ${period}</span>`;
        }
    } catch (error) {
        console.error(`Failed to load trend for ${elementId}:`, error);
    }
}

// Close tooltip when clicking outside
document.addEventListener('click', function(event) {
    if (categoryTooltip && categoryTooltip.style.display === 'block') {
        if (!event.target.closest('.category-tooltip') && !event.target.closest('.category-item')) {
            closeCategoryTooltip();
        }
    }
});
