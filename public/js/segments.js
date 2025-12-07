// Segments page functionality
let allCustomers = [];
let allOrders = [];
let currentSegment = null;

const segments = [
    {
        id: 1,
        name: 'Customers who have purchased at least once',
        filter: (customers, orders) => filterCustomersWithPurchases(customers, orders, 1)
    },
    {
        id: 2,
        name: 'Email subscribers',
        filter: (customers) => customers.filter(c => c.email_verified)
    },
    {
        id: 3,
        name: 'Abandoned checkouts in the last 30 days',
        filter: (customers) => customers.slice(0, 0) // Placeholder
    },
    {
        id: 4,
        name: 'Customers who have purchased more than once',
        filter: (customers, orders) => filterCustomersWithPurchases(customers, orders, 2)
    },
    {
        id: 5,
        name: 'Customers who haven\'t purchased',
        filter: (customers, orders) => filterCustomersWithoutPurchases(customers, orders)
    }
];

document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();
    loadSegmentData();
});

async function loadSegmentData() {
    try {
        // Load customers and orders
        [allCustomers, allOrders] = await Promise.all([
            API.get('/api/users'),
            API.get('/api/orders')
        ]);
        
        // Display segments list
        displaySegmentsList();
        
    } catch (error) {
        console.error('Error loading segment data:', error);
        showToast('Failed to load segment data', 'error');
    }
}

function displaySegmentsList() {
    const tbody = document.getElementById('segmentsTableBody');
    const totalCustomers = allCustomers.length;
    
    tbody.innerHTML = segments.map(segment => {
        const filteredCustomers = segment.filter(allCustomers, allOrders);
        const percentage = totalCustomers > 0 ? Math.round((filteredCustomers.length / totalCustomers) * 100) : 0;
        
        return `
            <tr onclick="viewSegment(${segment.id})" style="cursor: pointer;">
                <td><input type="checkbox" onclick="event.stopPropagation()"></td>
                <td>
                    <strong>${segment.name}</strong>
                </td>
                <td>${percentage}%</td>
                <td>Created at 7:45 pm</td>
                <td>
                    <span class="badge badge-success" style="font-size: 12px;">🤖 TeleBot</span>
                </td>
                <td>
                    <button class="btn-icon" onclick="event.stopPropagation()">···</button>
                </td>
            </tr>
        `;
    }).join('');

    // Search functionality
    document.getElementById('searchSegments').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

function viewSegment(segmentId) {
    currentSegment = segments.find(s => s.id === segmentId);
    
    // Hide list view, show detail view
    document.getElementById('segmentsListView').style.display = 'none';
    document.getElementById('segmentDetailView').style.display = 'block';
    
    // Update header
    document.querySelector('.content-header h1').textContent = currentSegment.name;
    
    // Load segment details
    loadSegmentDetail();
}

function loadSegmentDetail() {
    const filteredCustomers = currentSegment.filter(allCustomers, allOrders);
    
    // Update stats
    updateSegmentStats(filteredCustomers);
    
    // Display customers
    displaySegmentCustomers(filteredCustomers);
}

function updateSegmentStats(customers) {
    const segmentCount = customers.length;
    const totalCustomers = allCustomers.length;
    const percentage = totalCustomers > 0 ? Math.round((segmentCount / totalCustomers) * 100) : 0;
    
    document.getElementById('detailSegmentCount').textContent = `${segmentCount} customer${segmentCount !== 1 ? 's' : ''}`;
    document.getElementById('detailSegmentPercentage').textContent = `${percentage}% of your customer base`;
}

function backToSegmentsList() {
    document.getElementById('segmentsListView').style.display = 'block';
    document.getElementById('segmentDetailView').style.display = 'none';
    document.querySelector('.content-header h1').textContent = 'Segments';
    currentSegment = null;
}

function filterCustomersWithPurchases(customers, orders, minOrders = 1) {
    const customerOrderCounts = {};
    
    orders.forEach(order => {
        const customerId = order.user_id;
        if (!customerOrderCounts[customerId]) {
            customerOrderCounts[customerId] = {
                count: 0,
                totalSpent: 0,
                lastOrderDate: null
            };
        }
        customerOrderCounts[customerId].count++;
        customerOrderCounts[customerId].totalSpent += order.total_amount || 0;
        
        const orderDate = new Date(order.created_at);
        if (!customerOrderCounts[customerId].lastOrderDate || orderDate > customerOrderCounts[customerId].lastOrderDate) {
            customerOrderCounts[customerId].lastOrderDate = orderDate;
        }
    });
    
    return customers
        .filter(customer => customerOrderCounts[customer.id] && customerOrderCounts[customer.id].count >= minOrders)
        .map(customer => ({
            ...customer,
            orderCount: customerOrderCounts[customer.id].count,
            totalSpent: customerOrderCounts[customer.id].totalSpent,
            lastOrderDate: customerOrderCounts[customer.id].lastOrderDate
        }));
}

function filterCustomersWithoutPurchases(customers, orders) {
    const customerIds = new Set(orders.map(o => o.user_id));
    return customers.filter(customer => !customerIds.has(customer.id));
}

function displaySegmentCustomers(customers) {
    const tbody = document.getElementById('segmentCustomersTable');
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No customers found in this segment</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map(customer => {
        const emailStatus = customer.email_verified ? 'Subscribed' : 'Not subscribed';
        const location = customer.address || 'N/A';
        const orders = customer.orderCount || 0;
        const totalSpent = customer.totalSpent || 0;
        const lastOrder = customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'N/A';
        
        return `
            <tr>
                <td>
                    <div class="customer-info">
                        <strong>${customer.first_name || customer.username}</strong>
                        <div class="customer-email">${customer.email}</div>
                    </div>
                </td>
                <td>
                    <span class="badge ${customer.email_verified ? 'badge-success' : 'badge-secondary'}">
                        ${emailStatus}
                    </span>
                </td>
                <td>${location}</td>
                <td>${orders}</td>
                <td>SGD ${totalSpent.toFixed(2)}</td>
                <td>${lastOrder}</td>
            </tr>
        `;
    }).join('');
}

function formatDate(date) {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function createNewSegment() {
    showToast('Create segment feature coming soon', 'info');
}
