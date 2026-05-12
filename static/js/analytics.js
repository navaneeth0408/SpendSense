// analytics.js - Analytics Dashboard
(function(){
    // Initialize dark mode on page load
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
        // Reload charts to apply new theme colors
        setTimeout(() => loadAnalytics(), 100);
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
    
    // Add theme toggle listener
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Theme detection and color utilities for modern SaaS charts
    function getThemeColor() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return isDark ? '#E8ECF1' : '#374151';
    }
    
    function getGridColor() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    }
    
    function createLineGradient(ctx, chartHeight) {
        const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            gradient.addColorStop(0, 'rgba(45,212,191,0.3)');
            gradient.addColorStop(1, 'rgba(45,212,191,0.02)');
        } else {
            gradient.addColorStop(0, 'rgba(45,212,191,0.25)');
            gradient.addColorStop(1, 'rgba(45,212,191,0.01)');
        }
        return gradient;
    }
    
    // Label formatter - handles both daily and monthly x-axis labels
    function formatLabel(dateStr, mode) {
        /**
         * Format date labels based on grouping mode
         * @param {string} dateStr - Date string (YYYY-MM-DD for daily, "Mon YYYY" for monthly)
         * @param {string} mode - 'daily', 'monthly', 'auto'
         * @returns {string} Formatted label
         */
        if (!dateStr) return dateStr;
        
        // Check if already formatted as month (e.g., "Jan 2025")
        if (/^[A-Z][a-z]{2} \d{4}$/.test(dateStr)) {
            return dateStr;
        }
        
        // Auto-detect based on format
        if (mode === 'auto') {
            if (dateStr.includes('-')) {
                mode = 'daily';
            } else {
                mode = 'monthly';
            }
        }
        
        if (mode === 'daily') {
            // Format: YYYY-MM-DD -> MMM DD or DD/MM
            try {
                const [year, month, day] = dateStr.split('-');
                const date = new Date(year, parseInt(month) - 1, day);
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${monthNames[date.getMonth()]} ${day}`;
            } catch(e) {
                return dateStr;
            }
        }
        
        return dateStr;
    }
    
    // Check if analytics is locked
    function checkAnalyticsLock() {
        return fetch('/api/settings/security')
            .then(r => r.json())
            .then(settings => {
                if (settings.lock_analytics) {
                    showAnalyticsLockScreen();
                    return false;
                }
                return true;
            })
            .catch(err => {
                console.error('Error checking analytics lock:', err);
                return true; // Allow access if check fails
            });
    }

    // Display locked analytics screen
    function showAnalyticsLockScreen() {
        const mainContent = document.querySelector('.analytics-container') || document.querySelector('main') || document.body;
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:var(--bg-primary);padding:20px;">
                    <div style="text-align:center;">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color:var(--text-secondary);margin-bottom:20px;">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <h1 style="color:var(--text-heading);margin:20px 0;font-size:24px;">Analytics Locked</h1>
                        <p style="color:var(--text-secondary);margin-bottom:20px;max-width:400px;">Your analytics access has been restricted in your privacy settings. Contact your account administrator to unlock this feature.</p>
                        <a href="/" style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
                            Back to Dashboard
                        </a>
                    </div>
                </div>
            `;
        }
    }

    // Store current date range
    let currentStartDate = null;
    let currentEndDate = null;
    
    const advancedBtns = Array.from(document.querySelectorAll('.advanced-filter-btn'));
    const customStartDate = document.getElementById('custom-start-date');
    const customEndDate = document.getElementById('custom-end-date');
    const applyCustomBtn = document.getElementById('apply-custom-range');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    
    let pieChart = null;
    let lineChart = null;
    let barChart = null;

    // Get date range based on filter type
    function getDateRange(filterType) {
        const today = new Date();
        const end = new Date(today);
        const start = new Date(today);
        
        switch(filterType) {
            case '7days':
                start.setDate(today.getDate() - 7);
                break;
            case '30days':
                start.setDate(today.getDate() - 30);
                break;
            case '3months':
                start.setMonth(today.getMonth() - 3);
                break;
            case '6months':
                start.setMonth(today.getMonth() - 6);
                break;
            case 'year':
                start.setFullYear(today.getFullYear(), 0, 1);
                break;
            default:
                return null;
        }
        
        return {
            start: formatDateForInput(start),
            end: formatDateForInput(end)
        };
    }
    
    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Initialize filters
    function initSelectors(){
        checkAnalyticsLock().then(isUnlocked => {
            if (!isUnlocked) return;
            
            // Set default range to last 30 days
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            currentStartDate = formatDateForInput(thirtyDaysAgo);
            currentEndDate = formatDateForInput(today);
            
            // Update date inputs
            if(customStartDate) customStartDate.value = currentStartDate;
            if(customEndDate) customEndDate.value = currentEndDate;
            
            // Set first advanced filter button as active
            if(advancedBtns.length > 0){
                advancedBtns[1].classList.add('active'); // Last 30 Days
            }

            // Advanced filter button listeners
            advancedBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    advancedBtns.forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    const range = getDateRange(e.currentTarget.dataset.range);
                    if(range) {
                        currentStartDate = range.start;
                        currentEndDate = range.end;
                        if(customStartDate) customStartDate.value = range.start;
                        if(customEndDate) customEndDate.value = range.end;
                        loadAnalytics();
                    }
                });
            });
            
            // Custom range listeners
            if(applyCustomBtn) {
                applyCustomBtn.addEventListener('click', () => {
                    if(customStartDate.value && customEndDate.value) {
                        advancedBtns.forEach(b => b.classList.remove('active'));
                        currentStartDate = customStartDate.value;
                        currentEndDate = customEndDate.value;
                        loadAnalytics();
                    }
                });
            }
            
            // Export listeners
            if(exportExcelBtn) {
                exportExcelBtn.addEventListener('click', exportToExcel);
            }
            if(exportPdfBtn) {
                exportPdfBtn.addEventListener('click', exportToPdf);
            }
        });
    }

    // Build API URL with date range filters
    function getAnalyticsUrl(){
        let url = '/api/analytics?start_date=' + currentStartDate + '&end_date=' + currentEndDate;
        return url;
    }
    
    // Override the _parse_period_params parsing on backend
    function getApiDateParams() {
        return {
            start_date: currentStartDate,
            end_date: currentEndDate
        };
    }

    // Fetch and render all analytics data
    function loadAnalytics(){
        checkAnalyticsLock().then(isUnlocked => {
            if (!isUnlocked) return;
            
            const url = getAnalyticsUrl();
            
            // Fetch main analytics data
            Promise.all([
                fetch(url).then(r => r.json()),
                fetch('/api/analytics/comparison?start_date=' + currentStartDate + '&end_date=' + currentEndDate).then(r => r.json()),
                fetch('/api/analytics/spike-detector?start_date=' + currentStartDate + '&end_date=' + currentEndDate).then(r => r.json()),
                fetch('/api/analytics/forecast').then(r => r.json())
            ])
            .then(([data, comparison, spikes, forecast]) => {
                console.log('Analytics data received:', data);
                renderSmartInsights(data);
                renderSpendingAlerts(spikes);
                renderSpendingForecast(forecast);
                renderBudgetHealth(data);
                renderCategoryRanking(data);
                renderOverview(data);
                renderCategoryPie(data);
                renderTrendLine(data);
                renderBudgetBar(data);
                renderTopDays(data);
                renderPeriodComparison(comparison);
            })
            .catch(err => {
                console.error('Error loading analytics:', err);
                document.getElementById('overview-metrics').innerHTML = '<p style="color:var(--text-secondary);">Failed to load analytics data</p>';
            });
        });
    }

    // Render overview metrics
    function renderOverview(data){
        const container = document.getElementById('overview-metrics');
        container.innerHTML = '';
        
        const fmt = (v) => typeof v === 'number' ? '₹' + v.toFixed(2) : '0';
        const pct = typeof data.percentChange === 'number' ? data.percentChange.toFixed(1) + '%' : '0%';
        
        const cards = [
            {label: 'Total Spent', value: fmt(data.totalSpent)},
            {label: 'Avg per Day', value: fmt(data.avgPerDay)},
            {label: 'Top Category', value: data.highestCategory || 'N/A'},
            {label: 'Change vs Prev', value: pct}
        ];
        
        cards.forEach(card => {
            const div = document.createElement('div');
            div.style.cssText = 'min-width:140px;padding:12px;background:var(--border-light);border-radius:8px;';
            div.innerHTML = '<div style="color:var(--text-secondary);font-size:12px;font-weight:500;">' + card.label + '</div>' +
                            '<div style="font-weight:700;color:var(--text-heading);font-size:18px;margin-top:6px;font-family:\'Inter\',\'Segoe UI\',system-ui;">' + card.value + '</div>';
            container.appendChild(div);
        });
    }

    // Render smart insights panel
    function renderSmartInsights(data){
        const container = document.getElementById('smart-insights');
        if(!data.insights || data.insights.length === 0){
            container.innerHTML = '<p style="color:var(--text-secondary);">No insights available</p>';
            return;
        }
        
        container.innerHTML = '';
        const icons = ['📈', '💰', '⚠️', '🎯'];
        
        data.insights.forEach((insight, i) => {
            const card = document.createElement('div');
            card.style.cssText = 'display:flex;gap:12px;padding:12px;background:var(--border-light);border-radius:8px;align-items:flex-start;';
            const icon = icons[i % icons.length];
            card.innerHTML = '<span style="font-size:20px;flex-shrink:0;">' + icon + '</span>' +
                           '<span style="color:var(--text-body);font-size:14px;line-height:1.4;">' + insight + '</span>';
            container.appendChild(card);
        });
    }

    // Render budget health meter
    function renderBudgetHealth(data){
        const container = document.getElementById('budget-health-meter');
        if(!data.budgetHealth){
            container.innerHTML = '<p style="color:var(--text-secondary);">No budget data</p>';
            return;
        }
        
        const health = data.budgetHealth;
        const colorMap = {
            'green': '#22c55e',
            'orange': '#f59e0b',
            'red': '#ef4444'
        };
        const color = colorMap[health.color] || '#6b7280';
        
        container.innerHTML = '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                            '<span style="color:var(--text-body);font-size:14px;font-weight:500;">Budget Usage</span>' +
                            '<span style="color:var(--text-heading);font-weight:600;">' + health.percentage + '%</span>' +
                            '</div>' +
                            '<div style="width:100%;height:8px;background:var(--border-light);border-radius:4px;overflow:hidden;">' +
                            '<div style="height:100%;width:' + health.percentage + '%;background:' + color + ';"></div>' +
                            '</div>' +
                            '<div style="margin-top:8px;color:' + color + ';font-weight:600;font-size:14px;">' + health.status + '</div>' +
                            '<div style="margin-top:4px;color:var(--text-secondary);font-size:12px;">' + health.message + '</div>' +
                            '</div>';
    }

    // Render category ranking table
    function renderCategoryRanking(data){
        const container = document.getElementById('category-ranking');
        if(!data.categoryRanking || data.categoryRanking.length === 0){
            container.innerHTML = '<p style="color:var(--text-secondary);">No category data</p>';
            return;
        }
        
        let html = '<table style="width:100%;border-collapse:collapse;font-family:\'Inter\',\'Segoe UI\',system-ui;font-size:13px;">' +
                  '<tr style="border-bottom:1px solid var(--border-light);"><th style="text-align:left;padding:8px;font-weight:600;color:var(--text-heading);">Rank</th>' +
                  '<th style="text-align:left;padding:8px;font-weight:600;color:var(--text-heading);">Category</th>' +
                  '<th style="text-align:right;padding:8px;font-weight:600;color:var(--text-heading);">Amount</th>' +
                  '<th style="text-align:right;padding:8px;font-weight:600;color:var(--text-heading);">% Total</th></tr>';
        
        data.categoryRanking.forEach(row => {
            const rankDisplay = row.badge ? row.badge + ' ' + row.rank : row.rank;
            html += '<tr style="border-bottom:1px solid var(--border-light);">' +
                   '<td style="padding:8px;color:var(--text-body);">' + rankDisplay + '</td>' +
                   '<td style="padding:8px;color:var(--text-body);font-weight:500;">' + row.category + '</td>' +
                   '<td style="padding:8px;text-align:right;color:var(--text-heading);font-weight:600;">₹' + row.amount.toFixed(0) + '</td>' +
                   '<td style="padding:8px;text-align:right;color:var(--text-secondary);">' + row.percentage.toFixed(1) + '%</td>' +
                   '</tr>';
        });
        
        html += '</table>';
        container.innerHTML = html;
    }

    // Render category pie chart
    function renderCategoryPie(data){
        const parent = document.getElementById('categoryPie-parent');
        
        if(!data.categoryTotals || data.categoryTotals.length === 0){
            parent.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">No category data</p>';
            return;
        }
        
        // Canvas height for horizontal bar chart
        parent.innerHTML = '<canvas id="categoryPie" height="350"></canvas>';
        
        setTimeout(() => {
            const canvas = document.getElementById('categoryPie');
            if(!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if(pieChart) pieChart.destroy();
            
            // Sort categories by amount in descending order (highest spending on top)
            const sortedData = [...data.categoryTotals].sort((a, b) => (b.amount || 0) - (a.amount || 0));
            const labels = sortedData.map(c => c.category);
            const values = sortedData.map(c => c.amount || 0);
            
            pieChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Amount Spent',
                        data: values,
                        backgroundColor: '#60a5fa',
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { 
                            titleFont: { family: "'Inter', 'Segoe UI', system-ui", size: 14, weight: '600' }, 
                            bodyFont: { family: "'Inter', 'Segoe UI', system-ui", size: 13 }, 
                            backgroundColor: 'rgba(0,0,0,0.9)', 
                            padding: 12, 
                            titleColor: '#fff', 
                            bodyColor: '#fff', 
                            borderColor: getThemeColor(), 
                            borderWidth: 1, 
                            callbacks: { 
                                label: function(context) { 
                                    return '₹' + context.parsed.x.toFixed(2); 
                                } 
                            } 
                        },
                        datalabels: { display: false }
                    },
                    scales: {
                        x: { 
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                            ticks: { 
                                color: getThemeColor(), 
                                font: { family: "'Inter', 'Segoe UI', system-ui", size: 12 }, 
                                callback: function(value) { 
                                    return '₹' + value.toFixed(0); 
                                } 
                            }
                        },
                        y: {
                            grid: { display: false, drawBorder: false },
                            ticks: { 
                                color: getThemeColor(), 
                                font: { family: "'Inter', 'Segoe UI', system-ui", size: 13, weight: '500' } 
                            }
                        }
                    }
                }
            });
        }, 0);
    }

    // Render spending trend line chart
    function renderTrendLine(data){
        const parent = document.getElementById('trendLine-parent');
        
        if(!data.spendingTrend || data.spendingTrend.length === 0){
            parent.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">No trend data</p>';
            return;
        }
        
        parent.innerHTML = '<canvas id="trendLine" height="220"></canvas>';
        
        setTimeout(() => {
            const canvas = document.getElementById('trendLine');
            if(!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if(lineChart) lineChart.destroy();
            
            // Determine if data is daily or monthly
            const sampleDate = data.spendingTrend[0]?.date || '';
            const isDailyFormat = sampleDate.includes('-');
            const labelMode = isDailyFormat ? 'daily' : 'monthly';
            
            const labels = data.spendingTrend.map(t => formatLabel(t.date, labelMode));
            const values = data.spendingTrend.map(t => t.amount || 0);
            
            // Create gradient for smooth fill
            const gradient = createLineGradient(ctx, 220);
            
            lineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: labelMode === 'daily' ? 'Daily Spending' : 'Monthly Spending',
                        data: values,
                        borderColor: '#2dd4bf',
                        backgroundColor: gradient,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#2dd4bf',
                        pointBorderColor: 'white',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    onClick: function(evt, elements) {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const label = lineChart.data.labels[index];
                            showDrilldown('period', label);
                        }
                    },
                    plugins: { 
                        legend: { display: true, labels: { font: { family: "'Inter', 'Segoe UI', system-ui", size: 13, weight: '500' }, color: getThemeColor(), padding: 12, usePointStyle: true, pointStyle: 'circle' } }, 
                        tooltip: { titleFont: { family: "'Inter', 'Segoe UI', system-ui", size: 14, weight: '600' }, bodyFont: { family: "'Inter', 'Segoe UI', system-ui", size: 13 }, backgroundColor: 'rgba(0,0,0,0.9)', padding: 12, titleColor: '#fff', bodyColor: '#fff', borderColor: '#2dd4bf', borderWidth: 1, callbacks: { label: function(context) { return '₹' + context.parsed.y.toFixed(2); } } } 
                    },
                    scales: { 
                        y: { 
                            beginAtZero: true,
                            border: { display: false },
                            ticks: { font: { family: "'Inter', 'Segoe UI', system-ui", size: 12, weight: '500' }, color: getThemeColor(), callback: function(value) { return '₹' + value.toFixed(0); } }, 
                            grid: { color: getGridColor(), drawBorder: false, display: true } 
                        }, 
                        x: { 
                            border: { display: false },
                            ticks: { font: { family: "'Inter', 'Segoe UI', system-ui", size: 12 }, color: getThemeColor() }, 
                            grid: { display: false, drawBorder: false } 
                        } 
                    }
                }
            });
        }, 0);
    }

    // Render budget vs actual bar chart
    function renderBudgetBar(data){
        const parent = document.getElementById('budgetBar-parent');
        
        if(!data.budgetVsActual || data.budgetVsActual.length === 0){
            parent.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">No budget data</p>';
            return;
        }
        
        parent.innerHTML = '<canvas id="budgetBar" height="220"></canvas>';
        
        setTimeout(() => {
            const canvas = document.getElementById('budgetBar');
            if(!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if(barChart) barChart.destroy();
            
            const categories = data.budgetVsActual.map(b => b.category);
            // Shorten display labels for readability on x-axis
            const labelMap = {
                "Education": "Edu",
                "Entertainment": "Fun",
                "Photography": "Photo",
                "Transport": "Trans",
                "bus fee": "Bus",
                "Shopping": "Shop"
            };
            const displayLabels = categories.map(c => labelMap[c] || c);
            let budgets = data.budgetVsActual.map(b => b.budget || 0);
            let actuals = data.budgetVsActual.map(b => b.spent || 0);

            // Per-category color mapping so specific categories (e.g., Education) show correct color
            const colorMap = {
                'Education': '#2563eb',
                'Food': '#10b981',
                'Transport': '#8b5cf6',
                'Shopping': '#f59e0b',
                'Utilities': '#0ea5e9',
                'Entertainment': '#fb7185',
                'Photography': '#f97316',
                'Other': '#94a3b8'
            };

            // Helper to convert hex to rgba
            function hexToRgba(hex, alpha) {
                const h = hex.replace('#','');
                const bigint = parseInt(h, 16);
                const r = (bigint >> 16) & 255;
                const g = (bigint >> 8) & 255;
                const b = bigint & 255;
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }

            // use a single uniform color for all bars (dark-mode friendly blue)
            const uniformBase = '#60a5fa'; // subtle modern blue tone
            const budgetColors = categories.map(() => hexToRgba(uniformBase, 0.28));
            const actualColors = categories.map(() => hexToRgba(uniformBase, 0.95));
            
            // Normalize missing/zero values to 1 for log scale (cannot render 0)
            budgets = budgets.map(v => (v && v > 0) ? v : 1);
            actuals = actuals.map(v => (v && v > 0) ? v : 1);
            
            barChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: displayLabels,
                    datasets: [
                        {
                            label: 'Budget',
                            data: budgets,
                            backgroundColor: budgetColors,
                            borderRadius: 6,
                            borderSkipped: false,
                            base: 1
                        },
                        {
                            label: 'Actual',
                            data: actuals,
                            backgroundColor: actualColors,
                            borderRadius: 6,
                            borderSkipped: false,
                            base: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { bottom: 20 } },
                    indexAxis: undefined,
                    categoryPercentage: 0.6,
                    barPercentage: 0.7,
                    onClick: function(evt, elements) {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const category = categories[index];
                            if (category) {
                                showDrilldown('category', category);
                            }
                        }
                    },
                    plugins: {
                        legend: { labels: { font: { family: "'Inter', 'Segoe UI', system-ui", size: 13, weight: '500' }, color: getThemeColor(), padding: 12, usePointStyle: true, pointStyle: 'circle' } },
                        tooltip: { titleFont: { family: "'Inter', 'Segoe UI', system-ui", size: 14, weight: '600' }, bodyFont: { family: "'Inter', 'Segoe UI', system-ui", size: 13 }, backgroundColor: 'rgba(0,0,0,0.9)', padding: 12, titleColor: '#fff', bodyColor: '#fff', borderColor: getThemeColor(), borderWidth: 1, callbacks: { label: function(context) { const idx = context.dataIndex; const full = categories[idx] || context.label; return context.dataset.label + ': ' + full + ' — ₹' + (context.parsed.y || context.parsed).toFixed(2); } } },
                        datalabels: {
                            display: true,
                            color: function(context) { return getThemeColor(); },
                            anchor: 'end',
                            align: 'end',
                            formatter: function(value) { return value > 0 ? '₹' + Number(value).toLocaleString() : ''; },
                            font: { weight: '600', size: 11 }
                        }
                    },
                    scales: {
                        y: {
                            type: 'logarithmic',
                            min: 1,
                            border: { display: false },
                            ticks: {
                                font: { family: "'Inter', 'Segoe UI', system-ui", size: 12, weight: '500' },
                                color: getThemeColor(),
                                maxTicksLimit: 6,
                                callback: function(value) {
                                    const allowed = [1, 10, 100, 1000, 10000, 50000];
                                    if (!allowed.includes(value)) return '';
                                    return '₹' + value.toLocaleString();
                                }
                            },
                            grid: { color: getGridColor(), drawBorder: false }
                        },
                        x: {
                            border: { display: false },
                            ticks: {
                                font: { family: "'Inter', 'Segoe UI', system-ui", size: 12, weight: '500' },
                                color: getThemeColor(),
                                maxRotation: 30,
                                minRotation: 30,
                                padding: 10,
                                autoSkip: false
                            },
                            grid: { display: false, drawBorder: false }
                        }
                    }
                }
            });
        }, 0);
    }

    // Render top spending days
    function renderTopDays(data){
        const parent = document.getElementById('topDays-parent');
        
        if(!data.topDays || data.topDays.length === 0){
            parent.innerHTML = '<p style="color:var(--text-secondary);">No spending data</p>';
            return;
        }
        
        let html = '<ul style="list-style:none;padding:0;">';
        data.topDays.forEach(d => {
            const amount = typeof d.amount === 'number' ? d.amount.toFixed(2) : '0.00';
            html += '<li style="padding:12px 0;border-bottom:1px solid var(--border-light);font-family:\'Inter\',\'Segoe UI\',system-ui;display:flex;justify-content:space-between;align-items:center;"><strong style="color:var(--text-heading);font-weight:600;">' + d.date + '</strong>: <span style="color:var(--red-soft);font-weight:600;font-size:15px;">₹' + amount + '</span></li>';
        });
        html += '</ul>';
        parent.innerHTML = html;
    }

    // Drilldown handler for chart clicks - fetches and displays transaction details
    function showDrilldown(type, value) {
        // Get current filter dates
        const startDate = currentStartDate;
        const endDate = currentEndDate;
        
        // Category is extracted from bar chart labels (remove ₹ prefix if present)
        let category = value;
        if (category.includes('₹')) {
            category = category.split('₹')[0].trim();
        }
        
        // Fetch transactions for this category and date range
        const drilldownUrl = '/api/drilldown?category=' + encodeURIComponent(category) + 
                             '&start=' + startDate + 
                             '&end=' + endDate;
        
        fetch(drilldownUrl)
            .then(res => {
                if(!res.ok) throw new Error('Drilldown API returned status ' + res.status);
                return res.json();
            })
            .then(data => {
                // Populate modal with data
                const modal = document.getElementById('drilldown-modal');
                const title = document.getElementById('drilldown-title');
                const body = document.getElementById('drilldown-body');
                const summary = document.getElementById('drilldown-summary');
                
                // Set modal title
                title.textContent = data.category + ' Transactions';
                
                // Render transaction table
                if (data.transactions && data.transactions.length > 0) {
                    let tableHtml = '<table style="width:100%;border-collapse:collapse;font-family:\'Inter\',\'Segoe UI\',system-ui;">';
                    tableHtml += '<thead><tr style="border-bottom:2px solid var(--border-light);"><th style="padding:12px;text-align:left;color:var(--text-heading);font-weight:600;">Date</th><th style="padding:12px;text-align:right;color:var(--text-heading);font-weight:600;">Amount</th><th style="padding:12px;text-align:left;color:var(--text-heading);font-weight:600;">Notes</th></tr></thead>';
                    tableHtml += '<tbody>';
                    
                    data.transactions.forEach(tx => {
                        const amount = typeof tx.amount === 'number' ? tx.amount.toFixed(2) : '0.00';
                        const notes = tx.notes || '—';
                        tableHtml += '<tr style="border-bottom:1px solid var(--border-light);">';
                        tableHtml += '<td style="padding:12px;color:var(--text-primary);">' + tx.date + '</td>';
                        tableHtml += '<td style="padding:12px;text-align:right;color:var(--red-soft);font-weight:600;">₹' + amount + '</td>';
                        tableHtml += '<td style="padding:12px;color:var(--text-secondary);font-size:14px;">' + notes + '</td>';
                        tableHtml += '</tr>';
                    });
                    
                    tableHtml += '</tbody></table>';
                    body.innerHTML = tableHtml;
                } else {
                    body.innerHTML = '<p style="color:var(--text-secondary);padding:20px;text-align:center;">No transactions found for this period</p>';
                }
                
                // Set modal summary
                const totalAmount = typeof data.total === 'number' ? data.total.toFixed(2) : '0.00';
                const count = data.count || 0;
                summary.textContent = 'Total: ₹' + totalAmount + ' | ' + count + ' transaction' + (count !== 1 ? 's' : '');
                
                // Show modal
                modal.style.display = 'flex';
            })
            .catch(err => {
                console.error('Error fetching drilldown data:', err);
                alert('Failed to load transaction details. Please try again.');
            });
    }
    
    // Close drilldown modal
    function closeDrilldown() {
        const modal = document.getElementById('drilldown-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Render spending alerts (spike detector)
    function renderSpendingAlerts(data){
        const container = document.getElementById('spending-alerts');
        if(!data.spikes || data.spikes.length === 0){
            container.innerHTML = '<p style="color:var(--text-secondary);">No spending spikes detected</p>';
            return;
        }
        
        container.innerHTML = '';
        data.spikes.slice(0, 5).forEach(spike => {
            const card = document.createElement('div');
            card.style.cssText = 'display:flex;gap:12px;padding:12px;background:var(--border-light);border-radius:8px;align-items:center;cursor:pointer;border-left:4px solid #ef4444;';
            card.innerHTML = '<span style="font-size:20px;flex-shrink:0;">🚨</span>' +
                           '<div style="flex:1;">' +
                           '<strong style="color:var(--text-heading);font-weight:600;">' + spike.date + '</strong><br>' +
                           '<span style="color:var(--text-secondary);font-size:13px;">₹' + spike.amount.toFixed(2) + ' (' + spike.multiple + '× your normal day)</span>' +
                           '</div>';
            card.addEventListener('click', () => {
                showDrilldown('category', spike.date);
            });
            container.appendChild(card);
        });
    }
    
    // Render spending forecast
    function renderSpendingForecast(data){
        const container = document.getElementById('spending-forecast');
        
        if(!data) {
            container.innerHTML = '<p style="color:var(--text-secondary);">Unable to calculate forecast</p>';
            return;
        }
        
        const statusColors = {
            'on-track': '#22c55e',
            'warning': '#f59e0b',
            'danger': '#ef4444'
        };
        
        const statusText = {
            'on-track': 'On Track',
            'warning': 'Caution',
            'danger': 'Over Budget'
        };
        
        const color = statusColors[data.status] || '#6b7280';
        const status = statusText[data.status] || 'Unknown';
        
        const progressPct = Math.min((data.spent_so_far / data.projected_total) * 100, 100);
        
        let html = '<div style="margin-bottom:16px;">' +
                  '<p style="color:var(--text-body);font-size:14px;margin:0 0 8px 0;font-weight:500;">Monthly Forecast</p>' +
                  '<p style="color:var(--text-heading);font-size:18px;font-weight:700;margin:0;">₹' + data.projected_total.toFixed(2) + '</p>' +
                  '<p style="color:var(--text-secondary);font-size:12px;margin:4px 0 0 0;">At current rate (' + data.days_elapsed + ' days elapsed)</p>' +
                  '</div>' +
                  '<div style="margin-bottom:12px;">' +
                  '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
                  '<span style="color:var(--text-body);font-size:13px;font-weight:500;">Progress</span>' +
                  '<span style="color:var(--text-heading);font-weight:600;">' + progressPct.toFixed(0) + '%</span>' +
                  '</div>' +
                  '<div style="width:100%;height:10px;background:var(--border-light);border-radius:5px;overflow:hidden;">' +
                  '<div style="height:100%;width:' + progressPct + '%;background:' + color + ';"></div>' +
                  '</div>' +
                  '</div>' +
                  '<div style="padding:12px;background:var(--border-light);border-radius:8px;border-left:4px solid ' + color + ';">' +
                  '<div style="color:' + color + ';font-weight:600;margin-bottom:4px;">' + status + '</div>' +
                  '<div style="color:var(--text-secondary);font-size:12px;">' +
                  'Budget: ₹' + data.budget.toFixed(2) + ' | ' +
                  'Spent: ₹' + data.spent_so_far.toFixed(2) + ' | ' +
                  'Remaining: ' + data.days_remaining + ' days' +
                  '</div>' +
                  '</div>';
        
        container.innerHTML = html;
    }
    
    // Render period comparison
    function renderPeriodComparison(data){
        const container = document.getElementById('period-comparison');
        
        if(!data || data.error){
            container.innerHTML = '<p style="color:var(--text-secondary);">No comparison data available</p>';
            return;
        }
        
        container.innerHTML = '';
        
        const currentTotal = data.current_total || 0;
        const previousTotal = data.previous_total || 0;
        const totalChangePct = data.total_change_pct || 0;
        const topIncrease = data.top_increase;
        const topDecrease = data.top_decrease;
        
        // Main insight card
        const insightCard = document.createElement('div');
        insightCard.style.cssText = 'padding:16px;background:var(--border-light);border-radius:8px;margin-bottom:16px;border-left:4px solid ' + (totalChangePct < 0 ? '#22c55e' : '#ef4444') + ';';
        
        const trendIcon = totalChangePct < 0 ? '📉' : '📈';
        const trendText = totalChangePct < 0 ? 'less' : 'more';
        const trendPct = Math.abs(totalChangePct);
        
        let insightHTML = '<div style="margin-bottom:12px;">' +
                         '<span style="font-size:24px;margin-right:8px;">' + trendIcon + '</span>' +
                         '<span style="color:var(--text-body);font-size:16px;font-weight:600;">You spent ' + trendPct.toFixed(1) + '% ' + trendText + ' than last period</span>' +
                         '</div>' +
                         '<span style="color:var(--text-secondary);font-size:14px;">₹' + currentTotal.toFixed(0) + ' vs ₹' + previousTotal.toFixed(0) + '</span>';
        
        insightCard.innerHTML = insightHTML;
        container.appendChild(insightCard);
        
        // Top increase and decrease
        if(topIncrease || topDecrease) {
            const metricsDiv = document.createElement('div');
            metricsDiv.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;';
            
            if(topIncrease) {
                const increaseCard = document.createElement('div');
                increaseCard.style.cssText = 'padding:12px;background:#fee2e2;border-radius:8px;border-left:3px solid #ef4444;';
                increaseCard.innerHTML = '<div style="font-size:16px;margin-bottom:4px;">🔺</div>' +
                                        '<span style="color:#7f1d1d;font-weight:500;display:block;font-size:12px;">Biggest increase</span>' +
                                        '<span style="color:#991b1b;font-weight:700;font-size:14px;display:block;margin-top:4px;">' + topIncrease.category + '</span>' +
                                        '<span style="color:#b91c1c;font-size:12px;">+₹' + Math.abs(topIncrease.amount).toFixed(0) + '</span>';
                metricsDiv.appendChild(increaseCard);
            }
            
            if(topDecrease) {
                const decreaseCard = document.createElement('div');
                decreaseCard.style.cssText = 'padding:12px;background:#dcfce7;border-radius:8px;border-left:3px solid #22c55e;';
                decreaseCard.innerHTML = '<div style="font-size:16px;margin-bottom:4px;">🔻</div>' +
                                        '<span style="color:#15803d;font-weight:500;display:block;font-size:12px;">Biggest decrease</span>' +
                                        '<span style="color:#166534;font-weight:700;font-size:14px;display:block;margin-top:4px;">' + topDecrease.category + '</span>' +
                                        '<span style="color:#16a34a;font-size:12px;">−₹' + Math.abs(topDecrease.amount).toFixed(0) + '</span>';
                metricsDiv.appendChild(decreaseCard);
            }
            
            container.appendChild(metricsDiv);
        }
        
        // Category breakdown
        if(data.categories && data.categories.length > 0) {
            const categoryTitle = document.createElement('div');
            categoryTitle.style.cssText = 'color:var(--text-secondary);font-size:12px;font-weight:600;margin-top:12px;margin-bottom:8px;text-transform:uppercase;';
            categoryTitle.textContent = 'Category Changes';
            container.appendChild(categoryTitle);
            
            data.categories.slice(0, 5).forEach(cat => {
                const isIncrease = cat.change > 0;
                const bgColor = isIncrease ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)';
                const textColor = isIncrease ? '#ef4444' : '#22c55e';
                
                const card = document.createElement('div');
                card.style.cssText = 'padding:10px;background:' + bgColor + ';border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;';
                card.innerHTML = '<div>' +
                               '<span style="color:var(--text-body);font-weight:500;display:block;">' + cat.category + '</span>' +
                               '<span style="color:var(--text-secondary);font-size:12px;">₹' + cat.current.toFixed(0) + '</span>' +
                               '</div>' +
                               '<div style="text-align:right;">' +
                               '<span style="color:' + textColor + ';font-weight:600;font-size:14px;">' + (isIncrease ? '+' : '−') + '₹' + Math.abs(cat.change).toFixed(0) + '</span><br>' +
                               '<span style="color:' + textColor + ';font-size:11px;">' + (isIncrease ? '↑' : '↓') + ' ' + Math.abs(cat.change_pct).toFixed(1) + '%</span>' +
                               '</div>';
                container.appendChild(card);
            });
        }
    }
    
    // Export to Excel
    function exportToExcel() {
        const url = '/api/analytics/export/excel?start_date=' + currentStartDate + '&end_date=' + currentEndDate;
        window.location.href = url;
    }
    
    // Export to PDF
    function exportToPdf() {
        const url = '/api/analytics/export/pdf?start_date=' + currentStartDate + '&end_date=' + currentEndDate;
        window.location.href = url;
    }

    // Add modal event listeners
    function setupModalListeners() {
        const modal = document.getElementById('drilldown-modal');
        const closeBtn = document.getElementById('drilldown-close-btn');
        const overlayCloseBtn = document.getElementById('drilldown-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeDrilldown);
        }
        
        if (overlayCloseBtn) {
            overlayCloseBtn.addEventListener('click', closeDrilldown);
        }
        
        // Close on modal overlay click (clicking outside the modal content)
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeDrilldown();
                }
            });
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDrilldown();
            }
        });
    }

    // Initialize on page load
    function init(){
        initTheme();
        initSelectors();
        setupModalListeners();
        loadAnalytics();
    }
    
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
