with open(r'C:\Users\kruti\OneDrive\Desktop\Pro1\static\js\analytics.js', 'r') as f:
    content = f.read()

# Replace the renderTrendLine function with modern SaaS version
old_trend_start = content.find('    // Render spending trend line chart')
if old_trend_start != -1:
    # Find the function start
    func_start = old_trend_start
    # Find the next function (// Render budget)
    next_func = content.find('    // Render budget vs actual bar chart', func_start)
    
    if next_func != -1:
        # Create the new function
        new_func = '''    // Render spending trend line chart - Modern SaaS style
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
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: true, labels: { font: { family: "'Inter', 'Segoe UI', system-ui", size: 13, weight: '500' }, color: getThemeColor(), padding: 12, usePointStyle: true, pointStyle: 'circle' } }, 
                        tooltip: { 
                            titleFont: { family: "'Inter', 'Segoe UI', system-ui", size: 14, weight: '600' }, 
                            bodyFont: { family: "'Inter', 'Segoe UI', system-ui", size: 13 }, 
                            backgroundColor: 'rgba(0,0,0,0.9)', 
                            padding: 12, 
                            titleColor: '#fff', 
                            bodyColor: '#fff',
                            borderColor: '#2dd4bf',
                            borderWidth: 1,
                            callbacks: { 
                                label: function(context) { return '₹' + context.parsed.y.toFixed(2); } 
                            } 
                        } 
                    },
                    scales: { 
                        y: { 
                            beginAtZero: true,
                            border: { display: false },
                            ticks: { 
                                font: { family: "'Inter', 'Segoe UI', system-ui", size: 12, weight: '500' }, 
                                color: getThemeColor(), 
                                callback: function(value) { return '₹' + value.toFixed(0); } 
                            }, 
                            grid: { 
                                color: getGridColor(),
                                drawBorder: false,
                                display: true
                            } 
                        }, 
                        x: { 
                            border: { display: false },
                            ticks: { 
                                font: { family: "'Inter', 'Segoe UI', system-ui", size: 12 }, 
                                color: getThemeColor() 
                            }, 
                            grid: { 
                                display: false,
                                drawBorder: false
                            } 
                        } 
                    }
                }
            });
        }, 0);
    }

'''
        
        # Replace
        updated_content = content[:func_start] + new_func + content[next_func:]
        
        with open(r'C:\Users\kruti\OneDrive\Desktop\Pro1\static\js\analytics.js', 'w') as f:
            f.write(updated_content)
        
        print('renderTrendLine updated successfully')
    else:
        print('Could not find next function')
else:
    print('Could not find renderTrendLine function')
