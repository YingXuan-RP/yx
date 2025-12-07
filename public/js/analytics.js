// Analytics page functionality
let salesChart, channelChart, avgOrderChart, productSalesChart, sessionsChart, conversionChart, deviceChart, locationChart, socialChart, referrerChart, sellThroughChart;

document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();
    loadAnalyticsData();
    
    document.getElementById('timePeriod').addEventListener('change', () => {
        loadAnalyticsData();
    });
});

async function loadAnalyticsData() {
    try {
        // Get all data
        const [orders, products, users, categories] = await Promise.all([
            API.get('/api/orders'),
            API.get('/api/products'),
            API.get('/api/users'),
            API.get('/api/categories')
        ]);
        
        // Calculate analytics
        const analytics = calculateAnalytics(orders, products, users, categories);
        
        // Update stats
        updateTopStats(analytics);
        updateSalesBreakdown(analytics);
        
        // Create charts
        createSalesOverTimeChart(analytics.salesOverTime);
        createChannelChart();
        createAvgOrderValueChart(analytics.avgOrderTrend);
        createProductSalesChart();
        createSessionsChart();
        createConversionChart();
        createDeviceChart();
        createLocationChart();
        createSocialChart();
        createReferrerChart();
        createSellThroughChart();
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Failed to load analytics data', 'error');
    }
}

function calculateAnalytics(orders, products, users, categories) {
    const now = new Date();
    const timePeriod = parseInt(document.getElementById('timePeriod').value);
    const startDate = new Date(now.getTime() - timePeriod * 24 * 60 * 60 * 1000);
    
    // Filter orders by date
    const recentOrders = orders.filter(o => new Date(o.created_at) >= startDate);
    
    // Calculate total revenue
    const totalRevenue = recentOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const avgOrderValue = recentOrders.length > 0 ? totalRevenue / recentOrders.length : 0;
    
    // Sales over time (daily)
    const salesOverTime = generateDailySales(recentOrders, timePeriod);
    
    // Avg order value trend
    const avgOrderTrend = generateAvgOrderTrend(recentOrders, timePeriod);
    
    // Returning customer rate
    const returningCustomers = users.filter(u => new Date(u.created_at) < startDate).length;
    const returningRate = users.length > 0 ? (returningCustomers / users.length * 100).toFixed(1) : 0;
    
    // Orders fulfilled (delivered)
    const ordersFulfilled = recentOrders.filter(o => o.status === 'delivered').length;
    
    return {
        totalRevenue,
        totalOrders: recentOrders.length,
        avgOrderValue,
        salesOverTime,
        avgOrderTrend,
        returningRate,
        ordersFulfilled,
        recentOrders,
        users,
        products,
        categories
    };
}

function updateTopStats(analytics) {
    document.getElementById('analyticsRevenue').textContent = `SGD ${analytics.totalRevenue.toFixed(2)}`;
    document.getElementById('analyticsTotalOrders').textContent = analytics.totalOrders;
    document.getElementById('returningRate').textContent = analytics.returningRate + '%';
    document.getElementById('ordersFulfilled').textContent = analytics.ordersFulfilled;
}

function updateSalesBreakdown(analytics) {
    const gross = analytics.totalRevenue;
    const discounts = 0; // No discount data
    const returns = 0; // No return data
    const netSales = gross - returns;
    const shipping = 0; // No shipping data
    const returnFees = 0; // No return fees
    const taxes = 0; // No tax data
    const total = netSales + shipping + returnFees;
    
    document.getElementById('breakdownGross').textContent = `SGD ${gross.toFixed(2)}`;
    document.getElementById('breakdownDiscounts').textContent = `SGD ${discounts.toFixed(2)}`;
    document.getElementById('breakdownReturns').textContent = `SGD ${returns.toFixed(2)}`;
    document.getElementById('breakdownNet').textContent = `SGD ${netSales.toFixed(2)}`;
    document.getElementById('breakdownShipping').textContent = `SGD ${shipping.toFixed(2)}`;
    document.getElementById('breakdownReturnFees').textContent = `SGD ${returnFees.toFixed(2)}`;
    document.getElementById('breakdownTaxes').textContent = `SGD ${taxes.toFixed(2)}`;
    document.getElementById('breakdownTotal').textContent = `SGD ${total.toFixed(2)}`;
}

function generateDailySales(orders, days) {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.toDateString() === date.toDateString();
        });
        const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total_amount, 0);
        
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: dayRevenue
        });
    }
    
    return data;
}

function generateDailyOrders(orders, days) {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.toDateString() === date.toDateString();
        });
        
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: dayOrders.length
        });
    }
    
    return data;
}

function calculateRevenueByCategoryData(orders, products, categories) {
    const categoryRevenue = {};
    
    categories.forEach(cat => {
        categoryRevenue[cat.name] = 0;
    });
    
    orders.forEach(order => {
        const items = orderItems.filter(item => item.order_id === order.id);
        items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
                const category = categories.find(c => c.id === product.category_id);
                if (category) {
                    categoryRevenue[category.name] += item.price * item.quantity;
                }
            }
        });
    });
    
    return categoryRevenue;
}

function generateSalesByHour(orders) {
    const hourData = Array(24).fill(0);
    
    orders.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        hourData[hour] += order.total_amount;
    });
    
    return hourData;
}

function generateAvgOrderTrend(orders, days) {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.toDateString() === date.toDateString();
        });
        
        const avgValue = dayOrders.length > 0 
            ? dayOrders.reduce((sum, o) => sum + o.total_amount, 0) / dayOrders.length 
            : 0;
        
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: avgValue
        });
    }
    
    return data;
}

function calculateTopProducts(orders, products) {
    const productSales = {};
    
    orders.forEach(order => {
        const items = orderItems.filter(item => item.order_id === order.id);
        items.forEach(item => {
            if (!productSales[item.product_id]) {
                productSales[item.product_id] = { quantity: 0, revenue: 0, name: item.product_name };
            }
            productSales[item.product_id].quantity += item.quantity;
            productSales[item.product_id].revenue += item.price * item.quantity;
        });
    });
    
    return Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
}

function calculateTopCustomers(orders, users) {
    const customerData = {};
    
    orders.forEach(order => {
        if (!customerData[order.user_id]) {
            const user = users.find(u => u.id === order.user_id);
            customerData[order.user_id] = {
                name: user ? user.name : 'Unknown',
                orders: 0,
                totalSpent: 0
            };
        }
        customerData[order.user_id].orders++;
        customerData[order.user_id].totalSpent += order.total_amount;
    });
    
    return Object.values(customerData)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
}

function generateRevenueOrdersData(orders, days) {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.toDateString() === date.toDateString();
        });
        
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0),
            orders: dayOrders.length
        });
    }
    
    return data;
}

function generateMonthlyComparison(orders) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(12).fill(0);
    
    orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        if (orderDate.getFullYear() === currentYear) {
            monthlyData[orderDate.getMonth()] += order.total_amount;
        }
    });
    
    return months.map((month, index) => ({
        month,
        value: monthlyData[index]
    }));
}

function createSalesOverTimeChart(data) {
    const ctx = document.getElementById('salesOverTimeChart');
    if (salesChart) salesChart.destroy();
    
    ctx.parentElement.style.height = '300px';
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Sales (SGD)',
                data: data.map(d => d.value),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => 'SGD ' + value.toFixed(0)
                    }
                }
            }
        }
    });
}

function createOrdersPerDayChart(data) {
    // This function is deprecated - using new chart functions instead
}

function createRevenueByCategoryChart(data) {
    // This function is deprecated - using new chart functions instead
}

function createOrderStatusChart(data) {
    // This function is deprecated - using new chart functions instead
}

function createSalesByHourChart(data) {
    // This function is deprecated - using new chart functions instead
}

function createAvgOrderValueChart(data) {
    const ctx = document.getElementById('avgOrderValueChart');
    if (avgOrderChart) avgOrderChart.destroy();
    
    ctx.parentElement.style.height = '250px';
    
    avgOrderChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Avg Order Value',
                data: data.map(d => d.value),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => 'SGD ' + value.toFixed(0)
                    }
                }
            }
        }
    });
}

function createStockStatusChart(products) {
    // This function is deprecated - using new chart functions instead
}

function createRevenueOrdersChart(data) {
    // This function is deprecated - using new chart functions instead
}

function createMonthlyComparisonChart(data) {
    // This function is deprecated - using new chart functions instead
}

function updateTopProductsTable(products) {
    // Deprecated - not used in new layout
}

function updateTopCustomersTable(customers) {
    // Deprecated - not used in new layout
}

function updateCustomerActivity(activity) {
    // Deprecated - not used in new layout
}

function createChannelChart() {
    const ctx = document.getElementById('channelChart');
    if (channelChart) channelChart.destroy();
    
    ctx.parentElement.style.height = '250px';
    
    channelChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Direct', 'Referral', 'Social'],
            datasets: [{
                data: [60, 25, 15],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createProductSalesChart() {
    const ctx = document.getElementById('productSalesChart');
    if (productSalesChart) productSalesChart.destroy();
    
    ctx.parentElement.style.height = '250px';
    
    productSalesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Product A', 'Product B', 'Product C', 'Product D'],
            datasets: [{
                label: 'Sales (SGD)',
                data: [450, 320, 280, 190],
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createSessionsChart() {
    const ctx = document.getElementById('sessionsChart');
    if (sessionsChart) sessionsChart.destroy();
    
    ctx.parentElement.style.height = '250px';
    
    sessionsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['12 AM', '5 AM', '10 AM', '3 PM', '8 PM'],
            datasets: [{
                label: 'Sessions',
                data: [5, 8, 15, 12, 9],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createConversionChart() {
    const ctx = document.getElementById('conversionChart');
    if (conversionChart) conversionChart.destroy();
    
    ctx.parentElement.style.height = '250px';
    
    conversionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['12 AM', '5 AM', '10 AM', '3 PM', '8 PM'],
            datasets: [{
                label: 'Conversion Rate (%)',
                data: [0.5, 1.2, 2.8, 2.1, 1.5],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => value + '%'
                    }
                }
            }
        }
    });
}

function createDeviceChart() {
    const ctx = document.getElementById('deviceChart');
    if (deviceChart) deviceChart.destroy();
    
    ctx.parentElement.style.height = '250px';
    
    deviceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mobile', 'Desktop', 'Tablet'],
            datasets: [{
                label: 'Sessions',
                data: [150, 280, 120],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createLocationChart() {
    const ctx = document.getElementById('locationChart');
    if (locationChart) locationChart.destroy();
    
    ctx.parentElement.style.height = '250px';
    
    locationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Singapore', 'Malaysia', 'Thailand', 'Others'],
            datasets: [{
                label: 'Sessions',
                data: [250, 180, 120, 80],
                backgroundColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createSocialChart() {
    const ctx = document.getElementById('socialChart');
    if (socialChart) socialChart.destroy();
    
    ctx.parentElement.style.height = '250px';
    
    socialChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Facebook', 'Instagram', 'TikTok', 'Twitter'],
            datasets: [{
                data: [35, 30, 25, 10],
                backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createReferrerChart() {
    const ctx = document.getElementById('referrerChart');
    if (!ctx) return;
    
    ctx.parentElement.style.height = '250px';
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [''],
            datasets: [{
                label: 'Direct',
                data: [4],
                backgroundColor: '#22d3ee',
                barThickness: 80
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    display: false
                }
            }
        }
    });
}

function createSellThroughChart() {
    const ctx = document.getElementById('sellThroughChart');
    if (!ctx) return;
    
    ctx.parentElement.style.height = '250px';
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['', '', '', '', '', ''],
            datasets: [{
                label: 'Sell-through rate',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#22d3ee',
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    display: false
                }
            }
        }
    });
}
