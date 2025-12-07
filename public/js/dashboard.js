// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    createMiniCharts();
    createBarChart();
});

async function loadDashboardData() {
    try {
        const data = await API.get('/api/dashboard/analytics');
        
        // Check for out of stock products
        checkOutOfStockProducts();
        
        // Update revenue and basic stats
        const revenueElements = document.querySelectorAll('#totalRevenue');
        revenueElements.forEach(el => el.textContent = formatCurrency(data.summary.totalRevenue));
        
        document.getElementById('totalCategories').textContent = data.summary.totalCategories;
        document.getElementById('totalProducts').textContent = data.summary.totalProducts;
        document.getElementById('totalOrders').textContent = data.summary.totalOrders;
        document.getElementById('totalSales').textContent = formatCurrency(data.summary.totalRevenue);
        
        // Random visitors for demo
        const visitors = Math.floor(Math.random() * 5000) + 15000;
        document.getElementById('totalVisits').textContent = visitors.toLocaleString();
        
        // Conversion rate calculation
        const conversionRate = data.summary.totalOrders > 0 
            ? ((data.summary.totalOrders / visitors) * 100).toFixed(1)
            : '0.0';
        document.getElementById('conversionRate').textContent = conversionRate + '%';
        
        // Update order stats
        const totalOrders = data.summary.totalOrders || 1;
        document.getElementById('pendingOrders').textContent = data.summary.pendingOrders;
        document.getElementById('processingOrders').textContent = data.summary.processingOrders;
        document.getElementById('deliveredOrders').textContent = data.summary.deliveredOrders;
        
        // Calculate percentages for donut chart
        const deliveredPercent = Math.round((data.summary.deliveredOrders / totalOrders) * 100);
        const processingPercent = Math.round((data.summary.processingOrders / totalOrders) * 100);
        const pendingPercent = Math.round((data.summary.pendingOrders / totalOrders) * 100);
        
        document.getElementById('deliveredPercent').textContent = deliveredPercent + '%';
        document.getElementById('processingPercent').textContent = processingPercent + '%';
        document.getElementById('pendingPercent').textContent = pendingPercent + '%';
        
        // Update donut chart
        updateDonutChart(deliveredPercent, processingPercent, pendingPercent);
        
        // Load recent orders
        loadRecentOrders(data.recentOrders);
        
        // Load low stock products
        loadLowStockProducts(data.lowStockProducts);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

async function checkOutOfStockProducts() {
    try {
        const products = await API.get('/api/products');
        const outOfStock = products.filter(p => p.stock === 0);
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10);
        
        const alertBanner = document.getElementById('outOfStockAlert');
        const alertMessage = document.getElementById('outOfStockMessage');
        
        if (outOfStock.length > 0 || lowStock.length > 0) {
            let message = '';
            if (outOfStock.length > 0) {
                const outOfStockNames = outOfStock.map(p => p.name).join(', ');
                message += `<strong>${outOfStock.length}</strong> product(s) are out of stock: <em>${outOfStockNames}</em>. `;
            }
            if (lowStock.length > 0) {
                message += `<strong>${lowStock.length}</strong> product(s) have low stock (≤10 units).`;
            }
            alertMessage.innerHTML = message;
            alertBanner.style.display = 'flex';
        } else {
            alertBanner.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking stock:', error);
    }
}

function updateDonutChart(delivered, processing, pending) {
    const circumference = 2 * Math.PI * 80;
    
    // Delivered (blue)
    const deliveredSlice = document.getElementById('deliveredSlice');
    const deliveredLength = (delivered / 100) * circumference;
    deliveredSlice.setAttribute('stroke-dasharray', `${deliveredLength} ${circumference}`);
    
    // Processing (orange) - starts after delivered
    const processingSlice = document.getElementById('processingSlice');
    const processingLength = (processing / 100) * circumference;
    processingSlice.setAttribute('stroke-dasharray', `${processingLength} ${circumference}`);
    processingSlice.setAttribute('stroke-dashoffset', -deliveredLength);
    
    // Pending (green) - starts after processing
    const pendingSlice = document.getElementById('pendingSlice');
    const pendingLength = (pending / 100) * circumference;
    pendingSlice.setAttribute('stroke-dasharray', `${pendingLength} ${circumference}`);
    pendingSlice.setAttribute('stroke-dashoffset', -(deliveredLength + processingLength));
    
    // Update center percentage
    const centerText = document.querySelector('.donut-chart svg text');
    if (centerText) {
        centerText.textContent = delivered + '%';
    }
}

function createMiniCharts() {
    // Create simple wave pattern for mini charts
    const charts = document.querySelectorAll('.mini-chart');
    charts.forEach((chart, index) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '40');
        svg.setAttribute('viewBox', '0 0 200 40');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = index % 2 === 0 
            ? 'M0,20 Q50,10 100,20 T200,20'
            : 'M0,20 Q50,30 100,20 T200,20';
        
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'rgba(255,255,255,0.6)');
        path.setAttribute('stroke-width', '2');
        
        svg.appendChild(path);
        chart.appendChild(svg);
    });
}

function createBarChart() {
    const canvas = document.getElementById('salesBarChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    
    // Sample data
    const productsData = [15, 20, 50, 18, 45, 35, 60, 40, 55];
    const categoriesData = [12, 18, 45, 15, 40, 28, 55, 35, 50];
    
    const maxValue = 60;
    const barWidth = 15;
    const gap = 25;
    const startX = 40;
    const chartHeight = 200;
    const chartTop = 20;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bars
    months.forEach((month, i) => {
        const x = startX + (i * gap * 2);
        
        // Categories bar (blue)
        const catHeight = (categoriesData[i] / maxValue) * chartHeight;
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x, chartTop + (chartHeight - catHeight), barWidth, catHeight);
        
        // Products bar (orange)
        const prodHeight = (productsData[i] / maxValue) * chartHeight;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + barWidth + 5, chartTop + (chartHeight - prodHeight), barWidth, prodHeight);
        
        // Month label
        ctx.fillStyle = '#64748b';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText(month, x + barWidth, chartTop + chartHeight + 20);
    });
}

function loadRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersTable');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.orderNumber}</strong></td>
            <td>${order.user ? (order.user.firstName || order.user.username || 'N/A') : 'N/A'}</td>
            <td>${order.items.length} item(s)</td>
            <td><strong>${formatCurrency(order.totalAmount)}</strong></td>
            <td><span class="badge badge-${getStatusColor(order.status)}">${order.status}</span></td>
            <td>${formatDate(order.createdAt)}</td>
        </tr>
    `).join('');
}

function loadLowStockProducts(products) {
    const container = document.getElementById('lowStockList');
    
    if (products.length === 0) {
        container.innerHTML = '<p class="text-muted">All products are well stocked!</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="list-item">
            <div>
                <strong>${product.name}</strong>
                <br>
                <small class="text-muted">${product.category ? product.category.name : 'N/A'}</small>
            </div>
            <span class="badge badge-warning">Stock: ${product.stock}</span>
        </div>
    `).join('');
}

function getStatusColor(status) {
    const colors = {
        pending: 'warning',
        confirmed: 'info',
        processing: 'info',
        shipped: 'info',
        delivered: 'success',
        cancelled: 'danger'
    };
    return colors[status] || 'secondary';
}
