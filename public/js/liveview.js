// Live View page functionality
let liveSessionsChart, customerTypeChart, liveMap;

document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();
    initializeLiveView();
    loadLiveViewData();
    
    // Refresh live data every 5 seconds
    setInterval(loadLiveViewData, 5000);
});

function initializeLiveView() {
    // Initialize map centered on Singapore
    if (document.getElementById('liveMap')) {
        liveMap = L.map('liveMap').setView([1.3521, 103.8198], 4);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(liveMap);
        
        // Add Singapore marker
        L.circleMarker([1.3521, 103.8198], {
            radius: 15,
            fillColor: '#8b5cf6',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(liveMap).bindPopup('<strong>Singapore</strong><br>Orders: 10');
        
        // Add other regional markers
        const markers = [
            { lat: 3.1390, lng: 101.6869, city: 'Malaysia', orders: 8 },
            { lat: 13.7563, lng: 100.5018, city: 'Thailand', orders: 5 },
            { lat: 21.0285, lng: 105.8542, city: 'Vietnam', orders: 3 }
        ];
        
        markers.forEach(marker => {
            L.circleMarker([marker.lat, marker.lng], {
                radius: 10,
                fillColor: '#3b82f6',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.7
            }).addTo(liveMap).bindPopup(`<strong>${marker.city}</strong><br>Orders: ${marker.orders}`);
        });
    }
}

async function loadLiveViewData() {
    try {
        const [orders, users] = await Promise.all([
            API.get('/api/orders'),
            API.get('/api/users')
        ]);
        
        updateLiveView(orders, users);
        
    } catch (error) {
        console.error('Error loading live view data:', error);
    }
}

function updateLiveView(orders, users) {
    // Get recent orders (last hour simulation)
    const recentOrders = orders.slice(-5);
    const visitorsNow = Math.floor(Math.random() * 50) + 20;
    const totalSalesNow = recentOrders.reduce((sum, o) => sum + o.total_amount, 0);
    
    document.getElementById('visitorsNow').textContent = visitorsNow;
    document.getElementById('liveTotalSales').textContent = `SGD ${totalSalesNow.toFixed(2)}`;
    document.getElementById('liveSessions').textContent = Math.floor(Math.random() * 200) + 50;
    document.getElementById('liveOrders').textContent = recentOrders.length;
    
    // Customer behavior
    document.getElementById('activeCarts').textContent = Math.floor(Math.random() * 15) + 5;
    document.getElementById('checkingOut').textContent = Math.floor(Math.random() * 8) + 2;
    document.getElementById('purchased').textContent = recentOrders.length;
    
    // Create live sessions chart
    createLiveSessionsChart();
    
    // Create customer type chart
    createCustomerTypeChart(users);
    
    // Update location data
    updateLocationData();
    
    // Update product sales
    updateProductSalesData();
}

function createLiveSessionsChart() {
    const ctx = document.getElementById('liveSessionsChart');
    if (liveSessionsChart) liveSessionsChart.destroy();
    
    liveSessionsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['30m ago', '20m ago', '10m ago', 'Now'],
            datasets: [{
                label: 'Sessions',
                data: [85, 92, 78, 95],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true },
                x: { display: true }
            }
        }
    });
}

function createCustomerTypeChart(users) {
    const ctx = document.getElementById('customerTypeChart');
    if (customerTypeChart) customerTypeChart.destroy();
    
    const newCustomers = users.length * 0.3;
    const returningCustomers = users.length * 0.7;
    
    customerTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['New', 'Returning'],
            datasets: [{
                data: [newCustomers, returningCustomers],
                backgroundColor: ['#f59e0b', '#10b981']
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

function updateLocationData() {
    const locations = [
        { city: 'Singapore', sessions: 45 },
        { city: 'Malaysia', sessions: 28 },
        { city: 'Thailand', sessions: 15 },
        { city: 'Vietnam', sessions: 8 }
    ];
    
    const locationContainer = document.getElementById('sessionsByLocation');
    locationContainer.innerHTML = locations.map(loc => 
        `<div class="location-item"><strong>${loc.city}</strong> <span>${loc.sessions} sessions</span></div>`
    ).join('');
}

function updateProductSalesData() {
    const products = [
        { name: 'Wireless Headphones', sales: 'SGD 450' },
        { name: 'USB-C Cable', sales: 'SGD 320' },
        { name: 'Phone Stand', sales: 'SGD 280' }
    ];
    
    const productContainer = document.getElementById('productSalesList');
    productContainer.innerHTML = products.map((prod, idx) => 
        `<div class="product-item"><strong>${idx + 1}. ${prod.name}</strong> <span>${prod.sales}</span></div>`
    ).join('');
}
