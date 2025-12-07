// Inventory page functionality
let currentPage = 1;
const itemsPerPage = 10;
let allInventory = [];
let allCategories = [];
let editingProductId = null;

document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();
    loadInventoryData();
    
    document.getElementById('searchInput').addEventListener('keyup', () => {
        currentPage = 1;
        displayInventory();
    });
    
    document.getElementById('stockFilter').addEventListener('change', () => {
        currentPage = 1;
        displayInventory();
    });
    
    document.getElementById('exportBtn').addEventListener('click', exportInventory);
    document.getElementById('stockForm').addEventListener('submit', updateStock);
});

async function loadInventoryData() {
    try {
        const [products, categories] = await Promise.all([
            API.get('/api/products'),
            API.get('/api/categories')
        ]);
        
        allInventory = products;
        allCategories = categories;
        
        updateInventoryStats();
        displayInventory();
        updatePagination();
        
        // Show empty state if no products
        if (products.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('inventoryView').style.display = 'none';
        } else {
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('inventoryView').style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading inventory:', error);
        showToast('Failed to load inventory data', 'error');
    }
}

function updateInventoryStats() {
    const totalProducts = allInventory.length;
    const inStock = allInventory.filter(p => p.stock > 10).length;
    const lowStock = allInventory.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = allInventory.filter(p => p.stock === 0).length;
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('inStock').textContent = inStock;
    document.getElementById('lowStock').textContent = lowStock;
    document.getElementById('outOfStock').textContent = outOfStock;
}

function displayInventory() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const stockFilter = document.getElementById('stockFilter').value;
    
    // Filter inventory
    let filteredInventory = allInventory.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery) ||
                            product.description.toLowerCase().includes(searchQuery);
        
        let matchesFilter = true;
        if (stockFilter === 'in-stock') {
            matchesFilter = product.stock > 10;
        } else if (stockFilter === 'low-stock') {
            matchesFilter = product.stock > 0 && product.stock <= 10;
        } else if (stockFilter === 'out-of-stock') {
            matchesFilter = product.stock === 0;
        }
        
        return matchesSearch && matchesFilter;
    });
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedInventory = filteredInventory.slice(start, end);
    
    const tbody = document.getElementById('inventoryTableBody');
    
    if (paginatedInventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products found</td></tr>';
        return;
    }
    
    tbody.innerHTML = paginatedInventory.map(product => {
        const category = allCategories.find(c => c.id === product.category_id);
        const categoryName = category ? category.name : 'N/A';
        
        let stockStatus = '';
        let stockClass = '';
        if (product.stock === 0) {
            stockStatus = 'Out of Stock';
            stockClass = 'status-expired';
        } else if (product.stock <= 10) {
            stockStatus = 'Low Stock';
            stockClass = 'status-warning';
        } else {
            stockStatus = 'In Stock';
            stockClass = 'status-active';
        }
        
        return `
            <tr>
                <td>
                    <div class="product-info">
                        <strong>${product.name}</strong>
                    </div>
                </td>
                <td>SKU-${product.id.toString().padStart(4, '0')}</td>
                <td>${categoryName}</td>
                <td>
                    <span class="stock-quantity ${stockClass}">${product.stock}</span>
                </td>
                <td>
                    <span class="status-badge ${stockClass}">${stockStatus}</span>
                </td>
                <td>SGD ${product.price.toFixed(2)}</td>
                <td>
                    <button class="btn-icon" onclick="openStockModal(${product.id})" title="Update Stock">📝</button>
                    <button class="btn-icon" onclick="viewProduct(${product.id})" title="View Details">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update pagination based on filtered results
    updatePaginationForFiltered(filteredInventory.length);
}

function updatePaginationForFiltered(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;
    
    const pageNumbersContainer = document.getElementById('pageNumbers');
    let pageNumbersHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pageNumbersHTML += `<button class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === 2 || i === totalPages - 1) {
            pageNumbersHTML += `<span class="page-ellipsis">...</span>`;
        }
    }
    
    pageNumbersContainer.innerHTML = pageNumbersHTML;
}

function updatePagination() {
    const totalPages = Math.ceil(allInventory.length / itemsPerPage);
    
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

function goToPage(page) {
    currentPage = page;
    displayInventory();
}

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayInventory();
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const stockFilter = document.getElementById('stockFilter').value;
    
    let filteredInventory = allInventory.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery);
        let matchesFilter = true;
        if (stockFilter === 'in-stock') matchesFilter = product.stock > 10;
        else if (stockFilter === 'low-stock') matchesFilter = product.stock > 0 && product.stock <= 10;
        else if (stockFilter === 'out-of-stock') matchesFilter = product.stock === 0;
        return matchesSearch && matchesFilter;
    });
    
    const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayInventory();
    }
});

function openStockModal(productId) {
    const product = allInventory.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    document.getElementById('stockProductName').textContent = product.name;
    document.getElementById('currentStock').textContent = product.stock;
    document.getElementById('stockForm').reset();
    document.getElementById('stockCalculation').style.display = 'none';
    
    document.getElementById('stockModal').style.display = 'flex';
}

function closeStockModal() {
    document.getElementById('stockModal').style.display = 'none';
    editingProductId = null;
}

function updateStockCalculation() {
    const action = document.getElementById('stockAction').value;
    const quantity = parseInt(document.getElementById('stockQuantity').value) || 0;
    const currentStock = parseInt(document.getElementById('currentStock').textContent);
    
    if (!action || !quantity) {
        document.getElementById('stockCalculation').style.display = 'none';
        return;
    }
    
    let newStock = currentStock;
    if (action === 'set') {
        newStock = quantity;
    } else if (action === 'add') {
        newStock = currentStock + quantity;
    } else if (action === 'remove') {
        newStock = Math.max(0, currentStock - quantity);
    }
    
    document.getElementById('newStockAmount').textContent = newStock;
    document.getElementById('stockCalculation').style.display = 'block';
}

async function updateStock(e) {
    e.preventDefault();
    
    const action = document.getElementById('stockAction').value;
    const quantity = parseInt(document.getElementById('stockQuantity').value);
    const reason = document.getElementById('stockReason').value;
    const currentStock = parseInt(document.getElementById('currentStock').textContent);
    
    if (!action || !quantity) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    let newStock = currentStock;
    if (action === 'set') {
        newStock = quantity;
    } else if (action === 'add') {
        newStock = currentStock + quantity;
    } else if (action === 'remove') {
        newStock = Math.max(0, currentStock - quantity);
    }
    
    try {
        const product = allInventory.find(p => p.id === editingProductId);
        await API.put(`/api/products/${editingProductId}`, {
            ...product,
            stock: newStock
        });
        
        showToast(`Stock updated successfully. ${reason ? 'Reason: ' + reason : ''}`, 'success');
        closeStockModal();
        loadInventoryData();
    } catch (error) {
        showToast('Failed to update stock', 'error');
    }
}

function viewProduct(productId) {
    window.location.href = `/products?id=${productId}`;
}

function exportInventory() {
    const csvContent = generateInventoryCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Inventory exported successfully', 'success');
}

function generateInventoryCSV() {
    const headers = ['Product Name', 'SKU', 'Category', 'Stock', 'Price', 'Status'];
    const rows = allInventory.map(product => {
        const category = allCategories.find(c => c.id === product.category_id);
        const status = product.stock === 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'In Stock';
        return [
            product.name,
            `SKU-${product.id.toString().padStart(4, '0')}`,
            category ? category.name : 'N/A',
            product.stock,
            product.price.toFixed(2),
            status
        ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('stockModal');
    if (e.target === modal) {
        closeStockModal();
    }
});
