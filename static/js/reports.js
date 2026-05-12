// Reports Management

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
        populateYearSelects();
        setupReportTypeButtons();
        setupGenerateButtons();
        setupThemeToggle();
        setupLogout();
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/';
    }
}

function populateYearSelects() {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = currentYear; i >= currentYear - 5; i--) {
        years.push(i);
    }

    // Populate monthly report years
    const monthlyYearSelect = document.getElementById('monthly-year');
    const categoryYearSelect = document.getElementById('category-year');
    const yearlyYearSelect = document.getElementById('yearly-year');

    [monthlyYearSelect, categoryYearSelect, yearlyYearSelect].forEach(select => {
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        });
    });

    // Set current month as default
    document.getElementById('monthly-month').value = new Date().getMonth() + 1;
    document.getElementById('category-month').value = new Date().getMonth() + 1;
    document.getElementById('monthly-year').value = currentYear;
    document.getElementById('category-year').value = currentYear;
    document.getElementById('yearly-year').value = currentYear;
}

function setupReportTypeButtons() {
    const reportTypeBtns = document.querySelectorAll('.report-type-btn');
    reportTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all buttons
            reportTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Hide all report sections
            document.querySelectorAll('.report-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show selected report section
            const reportType = this.dataset.report;
            document.getElementById(`${reportType}-report-section`).classList.add('active');
        });
    });
}

function setupGenerateButtons() {
    // Monthly Report
    const generateMonthlyBtn = document.getElementById('generate-monthly');
    if (generateMonthlyBtn) {
        generateMonthlyBtn.addEventListener('click', generateMonthlyReport);
    }

    // Category Report
    const generateCategoryBtn = document.getElementById('generate-category');
    if (generateCategoryBtn) {
        generateCategoryBtn.addEventListener('click', generateCategoryReport);
    }

    // Yearly Report
    const generateYearlyBtn = document.getElementById('generate-yearly');
    if (generateYearlyBtn) {
        generateYearlyBtn.addEventListener('click', generateYearlyReport);
    }

    // Setup Export Buttons
    setupExportButtons();
}

function setupExportButtons() {
    // Monthly Report Exports
    const monthlyPdfBtn = document.getElementById('export-monthly-pdf');
    if (monthlyPdfBtn) {
        monthlyPdfBtn.addEventListener('click', function() {
            const month = document.getElementById('monthly-month').value;
            const year = document.getElementById('monthly-year').value;
            downloadReport('monthly', month, year, 'pdf');
        });
    }

    const monthlyExcelBtn = document.getElementById('export-monthly-excel');
    if (monthlyExcelBtn) {
        monthlyExcelBtn.addEventListener('click', function() {
            const month = document.getElementById('monthly-month').value;
            const year = document.getElementById('monthly-year').value;
            downloadReport('monthly', month, year, 'excel');
        });
    }

    // Category Report Exports
    const categoryPdfBtn = document.getElementById('export-category-pdf');
    if (categoryPdfBtn) {
        categoryPdfBtn.addEventListener('click', function() {
            const month = document.getElementById('category-month').value;
            const year = document.getElementById('category-year').value;
            downloadReport('category', month, year, 'pdf');
        });
    }

    const categoryExcelBtn = document.getElementById('export-category-excel');
    if (categoryExcelBtn) {
        categoryExcelBtn.addEventListener('click', function() {
            const month = document.getElementById('category-month').value;
            const year = document.getElementById('category-year').value;
            downloadReport('category', month, year, 'excel');
        });
    }

    // Yearly Report Exports
    const yearlyPdfBtn = document.getElementById('export-yearly-pdf');
    if (yearlyPdfBtn) {
        yearlyPdfBtn.addEventListener('click', function() {
            const year = document.getElementById('yearly-year').value;
            downloadReport('yearly', null, year, 'pdf');
        });
    }

    const yearlyExcelBtn = document.getElementById('export-yearly-excel');
    if (yearlyExcelBtn) {
        yearlyExcelBtn.addEventListener('click', function() {
            const year = document.getElementById('yearly-year').value;
            downloadReport('yearly', null, year, 'excel');
        });
    }
}

async function downloadReport(reportType, month, year, format) {
    try {
        let url = `/api/export/${format}?type=${reportType}&year=${year}`;
        if (month) {
            url += `&month=${month}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to export ${format}`);
        }

        // Get filename from response headers or generate one
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `report_${reportType}_${year}`;
        if (month) {
            filename = `report_${reportType}_${month}_${year}`;
        }
        filename = filename + (format === 'pdf' ? '.pdf' : '.xlsx');

        // Create blob and trigger download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        alert(`Error downloading ${format}: ${error.message}`);
    }
}

async function generateMonthlyReport() {
    const month = document.getElementById('monthly-month').value;
    const year = document.getElementById('monthly-year').value;
    const contentDiv = document.getElementById('monthly-content');
    
    // Safety check
    if (!contentDiv) {
        console.error('[Reports] monthly-content element not found in DOM');
        return;
    }

    try {
        console.log('[Reports-Monthly] Generating report for', month, '/', year);
        contentDiv.innerHTML = '<div class="report-loading">⏳ Generating report...</div>';

        const response = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('[Reports-Monthly] Received data:', data);
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format');
        }
        
        displayMonthlyReportContent(data);
        
        // Show export buttons
        const pdfBtn = document.getElementById('export-monthly-pdf');
        const excelBtn = document.getElementById('export-monthly-excel');
        if (pdfBtn) pdfBtn.style.display = 'inline-block';
        if (excelBtn) excelBtn.style.display = 'inline-block';
        
        console.log('[Reports-Monthly] Rendered successfully');

    } catch (error) {
        console.error('[Reports-Monthly] Error generating report:', error);
        contentDiv.innerHTML = `<div class="report-error">❌ Error generating report: ${error.message}</div>`;
    }
}

async function generateCategoryReport() {
    const month = document.getElementById('category-month').value;
    const year = document.getElementById('category-year').value;
    const contentDiv = document.getElementById('category-content');
    
    // Safety check
    if (!contentDiv) {
        console.error('[Reports] category-content element not found in DOM');
        return;
    }

    try {
        console.log('[Reports-Category] Generating report for', month, '/', year);
        contentDiv.innerHTML = '<div class="report-loading">⏳ Generating report...</div>';

        const response = await fetch(`/api/reports/category?month=${month}&year=${year}`);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('[Reports-Category] Received data:', data);
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format');
        }
        
        displayCategoryReportContent(data);
        
        // Show export button
        const pdfBtn = document.getElementById('export-category-pdf');
        if (pdfBtn) pdfBtn.style.display = 'inline-block';
        
        console.log('[Reports-Category] Rendered successfully');

    } catch (error) {
        console.error('[Reports-Category] Error generating report:', error);
        contentDiv.innerHTML = `<div class="report-error">❌ Error generating report: ${error.message}</div>`;
    }
}

async function generateYearlyReport() {
    const year = document.getElementById('yearly-year').value;
    const contentDiv = document.getElementById('yearly-content');
    
    // Safety check
    if (!contentDiv) {
        console.error('[Reports] yearly-content element not found in DOM');
        return;
    }

    try {
        console.log('[Reports-Yearly] Generating report for year', year);
        contentDiv.innerHTML = '<div class="report-loading">⏳ Generating report...</div>';

        const response = await fetch(`/api/reports/yearly?year=${year}`);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('[Reports-Yearly] Received data:', data);
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format');
        }
        
        displayYearlyReportContent(data);
        
        // Show export button
        const pdfBtn = document.getElementById('export-yearly-pdf');
        if (pdfBtn) pdfBtn.style.display = 'inline-block';
        
        console.log('[Reports-Yearly] Rendered successfully');

    } catch (error) {
        console.error('[Reports-Yearly] Error generating report:', error);
        contentDiv.innerHTML = `<div class="report-error">❌ Error generating report: ${error.message}</div>`;
    }
}

function displayMonthlyReportContent(data) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
        console.error('[Reports-Monthly] Invalid data:', data);
        return;
    }
    
    const month = data.month || '1';
    const year = data.year || new Date().getFullYear();
    const monthName = monthNames[parseInt(month) - 1] || 'Unknown';
    const total = typeof data.total === 'number' ? data.total : 0;
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const topExpenses = Array.isArray(data.top_expenses) ? data.top_expenses : [];

    console.log('[Reports-Monthly] Displaying:', { month, year, total, categories: categories.length, expenses: topExpenses.length });

    let html = `
        <div class="report-summary">
            <h4>${monthName} ${year} Report</h4>
            <div class="summary-metrics">
                <div class="metric">
                    <span class="metric-label">Total Expenses</span>
                    <span class="metric-value">₹${total.toFixed(2)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Categories</span>
                    <span class="metric-value">${categories.length}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Transactions</span>
                    <span class="metric-value">${categories.reduce((sum, cat) => sum + (cat.count || 0), 0)}</span>
                </div>
            </div>
        </div>

        <div class="report-section-content">
            <h5>Category Breakdown</h5>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Count</th>
                        <th>Total Amount</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (categories.length === 0) {
        html += `<tr><td colspan="3" class="empty-cell">No categories found</td></tr>`;
    } else {
        categories.forEach(cat => {
            if (!cat) return;
            html += `
                        <tr>
                            <td>${cat.category || 'N/A'}</td>
                            <td>${cat.count || 0}</td>
                            <td>₹${(typeof cat.total === 'number' ? cat.total : 0).toFixed(2)}</td>
                        </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    if (topExpenses && topExpenses.length > 0) {
        html += `
            <div class="report-section-content">
                <h5>Top 10 Expenses</h5>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        topExpenses.forEach(exp => {
            if (!exp) return;
            html += `
                        <tr>
                            <td>${exp.date || 'N/A'}</td>
                            <td>${exp.category || 'N/A'}</td>
                            <td>₹${(typeof exp.amount === 'number' ? exp.amount : 0).toFixed(2)}</td>
                        </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    const contentDiv = document.getElementById('monthly-content');
    if (contentDiv) {
        contentDiv.innerHTML = html;
        console.log('[Reports-Monthly] Content displayed successfully');
    } else {
        console.error('[Reports-Monthly] Content container not found');
    }
}

function displayCategoryReportContent(data) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
        console.error('[Reports-Category] Invalid data:', data);
        return;
    }
    
    const month = data.month || '1';
    const year = data.year || new Date().getFullYear();
    const monthName = monthNames[parseInt(month) - 1] || 'Unknown';
    const total = typeof data.total === 'number' ? data.total : 0;
    const categories = Array.isArray(data.categories) ? data.categories : [];

    console.log('[Reports-Category] Displaying:', { month, year, total, categories: categories.length });

    let html = `
        <div class="report-summary">
            <h4>Category Breakdown - ${monthName} ${year}</h4>
            <div class="summary-metrics">
                <div class="metric">
                    <span class="metric-label">Total Spent</span>
                    <span class="metric-value">₹${total.toFixed(2)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Categories</span>
                    <span class="metric-value">${categories.length}</span>
                </div>
            </div>
        </div>

        <div class="report-section-content">
            <h5>Category Details</h5>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Percentage</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (categories.length === 0) {
        html += `<tr><td colspan="4" class="empty-cell">No categories found</td></tr>`;
    } else {
        categories.forEach(cat => {
            if (!cat) return;
            const percentage = typeof cat.percentage === 'number' ? cat.percentage.toFixed(1) : '0.0';
            const catTotal = typeof cat.total === 'number' ? cat.total : 0;
            html += `
                    <tr>
                        <td><strong>${cat.category || 'N/A'}</strong></td>
                        <td>₹${catTotal.toFixed(2)}</td>
                        <td>
                            <div class="percentage-bar">
                                <div class="percentage-fill" style="width: ${percentage}%"></div>
                                <span class="percentage-text">${percentage}%</span>
                            </div>
                        </td>
                        <td>${cat.count || 0}</td>
                    </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    const contentDiv = document.getElementById('category-content');
    if (contentDiv) {
        contentDiv.innerHTML = html;
        console.log('[Reports-Category] Content displayed successfully');
    } else {
        console.error('[Reports-Category] Content container not found');
    }
}

function displayYearlyReportContent(data) {
    // Validate data structure
    if (!data || typeof data !== 'object') {
        console.error('[Reports-Yearly] Invalid data:', data);
        return;
    }
    
    const year = data.year || new Date().getFullYear();
    const total = typeof data.total === 'number' ? data.total : 0;
    const monthlyData = Array.isArray(data.monthly_data) ? data.monthly_data : [];
    const categories = Array.isArray(data.categories) ? data.categories : [];

    console.log('[Reports-Yearly] Displaying:', { year, total, months: monthlyData.length, categories: categories.length });

    let html = `
        <div class="report-summary">
            <h4>Yearly Summary - ${year}</h4>
            <div class="summary-metrics">
                <div class="metric">
                    <span class="metric-label">Total Expenses</span>
                    <span class="metric-value">₹${total.toFixed(2)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Average Monthly</span>
                    <span class="metric-value">₹${(total / 12).toFixed(2)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Categories</span>
                    <span class="metric-value">${categories.length}</span>
                </div>
            </div>
        </div>

        <div class="report-section-content">
            <h5>Monthly Breakdown</h5>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Total Amount</th>
                    </tr>
                </thead>
                <tbody>
    `;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (monthlyData.length === 0) {
        html += `<tr><td colspan="2" class="empty-cell">No data for this year</td></tr>`;
    } else {
        monthlyData.forEach(month => {
            if (!month) return;
            const monthNum = parseInt(month.month || 0);
            const monthAmount = typeof month.total === 'number' ? month.total : 0;
            html += `
                    <tr>
                        <td>${monthNames[monthNum - 1] || 'Unknown'}</td>
                        <td>₹${monthAmount.toFixed(2)}</td>
                    </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    if (categories && categories.length > 0) {
        html += `
            <div class="report-section-content">
                <h5>Top Categories</h5>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Total Amount</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        categories.forEach(cat => {
            if (!cat) return;
            const catTotal = typeof cat.total === 'number' ? cat.total : 0;
            html += `
                        <tr>
                            <td>${cat.category || 'N/A'}</td>
                            <td>₹${catTotal.toFixed(2)}</td>
                            <td>${cat.count || 0}</td>
                        </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    const contentDiv = document.getElementById('yearly-content');
    if (contentDiv) {
        contentDiv.innerHTML = html;
        console.log('[Reports-Yearly] Content displayed successfully');
    } else {
        console.error('[Reports-Yearly] Content container not found');
    }
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


