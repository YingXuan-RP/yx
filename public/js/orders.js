// Orders management
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});

async function loadOrders() {
    try {
        const orders = await API.get('/api/orders');
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Failed to load orders', 'error');
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTable');
    const emptyState = document.getElementById('emptyState');
    const ordersView = document.getElementById('ordersView');
    
    if (orders.length === 0) {
        emptyState.style.display = 'block';
        ordersView.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    ordersView.style.display = 'block';
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.orderNumber}</strong></td>
            <td>${order.user ? (order.user.firstName || order.user.username || 'N/A') : 'N/A'}</td>
            <td>${order.items.length} item(s)</td>
            <td><strong>${formatCurrency(order.totalAmount)}</strong></td>
            <td><span class="badge badge-${getStatusColor(order.status)}">${order.status}</span></td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewOrder('${order._id}')">View Details</button>
            </td>
        </tr>
    `).join('');
}

async function viewOrder(id) {
    try {
        const order = await API.get(`/api/orders/${id}`);
        
        const detailsHtml = `
            <div class="order-details">
                <div class="order-header">
                    <div>
                        <h3>Order ${order.orderNumber}</h3>
                        <p class="text-muted">Placed on ${formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                        <label for="orderStatus">Status:</label>
                        <select id="orderStatus" class="status-select" onchange="updateOrderStatus('${order._id}', this.value)">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </div>
                
                <div class="details-section">
                    <h4>Customer Information</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <strong>Name:</strong>
                            <span>${order.user ? (order.user.firstName + ' ' + (order.user.lastName || '')) : 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Username:</strong>
                            <span>${order.user && order.user.username ? '@' + order.user.username : '-'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Phone:</strong>
                            <span>${order.phoneNumber}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Delivery Address:</strong>
                            <span>${order.deliveryAddress}</span>
                        </div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h4>Order Items</h4>
                    <table class="order-items-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.name || (item.product ? item.product.name : 'N/A')}</td>
                                    <td>${formatCurrency(item.price)}</td>
                                    <td>${item.quantity}</td>
                                    <td><strong>${formatCurrency(item.price * item.quantity)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3"><strong>Total</strong></td>
                                <td><strong>${formatCurrency(order.totalAmount)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                ${order.notes ? `
                    <div class="details-section">
                        <h4>Notes</h4>
                        <p>${order.notes}</p>
                    </div>
                ` : ''}
                
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">Close</button>
                </div>
            </div>
        `;
        
        document.getElementById('orderDetails').innerHTML = detailsHtml;
        openModal('orderModal');
    } catch (error) {
        console.error('Error loading order:', error);
        showToast('Failed to load order details', 'error');
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await API.patch(`/api/orders/${orderId}/status`, { status: newStatus });
        showToast('Order status updated successfully!');
        loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Failed to update order status', 'error');
    }
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
