// Discounts page functionality
let currentPage = 1;
const itemsPerPage = 10;
let allDiscounts = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();
    loadDiscounts();
    
    document.getElementById('searchInput').addEventListener('keyup', () => {
        currentPage = 1;
        loadDiscounts();
    });
    
    document.getElementById('createBtn').addEventListener('click', openCreateModal);
    document.getElementById('discountForm').addEventListener('submit', saveDiscount);
    document.getElementById('discountType').addEventListener('change', updateDiscountDisplay);
});

async function loadDiscounts() {
    try {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const response = await API.get('/api/discounts');
        
        allDiscounts = response.filter(d => 
            d.code.toLowerCase().includes(searchQuery) ||
            d.category.toLowerCase().includes(searchQuery) ||
            d.description.toLowerCase().includes(searchQuery)
        );
        
        displayDiscounts();
        updatePagination();
    } catch (error) {
        console.error('Error loading discounts:', error);
        showToast('Failed to load discounts', 'error');
    }
}

function displayDiscounts() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedDiscounts = allDiscounts.slice(start, end);
    
    const tbody = document.getElementById('discountsTableBody');
    
    if (paginatedDiscounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No discounts found</td></tr>';
        return;
    }
    
    tbody.innerHTML = paginatedDiscounts.map(discount => {
        const valueDisplay = discount.type === 'percentage' ? `${discount.value}%` : `SGD ${discount.value.toFixed(2)}`;
        const isExpired = new Date(discount.validUntil) < new Date();
        const statusClass = isExpired ? 'status-expired' : (discount.isActive ? 'status-active' : 'status-inactive');
        const statusText = isExpired ? 'Expired' : (discount.isActive ? 'Active' : 'Inactive');
        
        return `
            <tr>
                <td><strong>${discount.code}</strong></td>
                <td>${discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                <td>${valueDisplay}</td>
                <td>${discount.usageLimit === 0 ? 'Unlimited' : discount.usageLimit}</td>
                <td>${discount.used || 0}</td>
                <td>${new Date(discount.validUntil).toLocaleDateString()}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn-icon" onclick="editDiscount(${discount.id})" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="openDeleteModal(${discount.id}, '${discount.code}')" title="Delete">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePagination() {
    const totalPages = Math.ceil(allDiscounts.length / itemsPerPage);
    
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
    
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

function goToPage(page) {
    currentPage = page;
    displayDiscounts();
    updatePagination();
}

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayDiscounts();
        updatePagination();
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    const totalPages = Math.ceil(allDiscounts.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayDiscounts();
        updatePagination();
    }
});

function openCreateModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Create Discount';
    document.getElementById('discountForm').reset();
    document.getElementById('discountCode').focus();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('validUntil').min = today;
    
    document.getElementById('discountModal').style.display = 'flex';
}

async function editDiscount(id) {
    try {
        const discount = await API.get(`/api/discounts/${id}`);
        
        editingId = id;
        document.getElementById('modalTitle').textContent = 'Edit Discount';
        
        document.getElementById('discountCode').value = discount.code;
        document.getElementById('discountType').value = discount.type;
        document.getElementById('discountValue').value = discount.value;
        document.getElementById('usageLimit').value = discount.usageLimit || 0;
        document.getElementById('validUntil').value = discount.validUntil.split('T')[0];
        document.getElementById('discountCategory').value = discount.category || '';
        document.getElementById('minimumPurchase').value = discount.minimumPurchase || 0;
        document.getElementById('discountDescription').value = discount.description || '';
        document.getElementById('isActive').checked = discount.isActive;
        
        updateDiscountDisplay();
        document.getElementById('discountModal').style.display = 'flex';
    } catch (error) {
        showToast('Failed to load discount details', 'error');
    }
}

function updateDiscountDisplay() {
    const type = document.getElementById('discountType').value;
    const valueInput = document.getElementById('discountValue');
    
    if (type === 'percentage') {
        valueInput.placeholder = 'e.g., 10 for 10%';
        valueInput.max = 100;
    } else if (type === 'fixed') {
        valueInput.placeholder = 'e.g., 5.00 for SGD 5';
        valueInput.max = '';
    }
}

function closeDiscountModal() {
    document.getElementById('discountModal').style.display = 'none';
    document.getElementById('discountForm').reset();
    editingId = null;
}

async function saveDiscount(e) {
    e.preventDefault();
    
    const code = document.getElementById('discountCode').value.trim().toUpperCase();
    const type = document.getElementById('discountType').value;
    const value = parseFloat(document.getElementById('discountValue').value);
    const usageLimit = parseInt(document.getElementById('usageLimit').value) || 0;
    const validUntil = document.getElementById('validUntil').value;
    const category = document.getElementById('discountCategory').value || '';
    const minimumPurchase = parseFloat(document.getElementById('minimumPurchase').value) || 0;
    const description = document.getElementById('discountDescription').value;
    const isActive = document.getElementById('isActive').checked;
    
    // Validation
    if (!code || !type || !value || !validUntil) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (value < 0) {
        showToast('Discount value cannot be negative', 'error');
        return;
    }
    
    if (type === 'percentage' && value > 100) {
        showToast('Percentage discount cannot exceed 100%', 'error');
        return;
    }
    
    // Check for duplicate code (only if creating new)
    if (!editingId && allDiscounts.some(d => d.code === code)) {
        showToast(`Discount code "${code}" already exists. Please use a different code.`, 'error');
        return;
    }
    
    const discountData = {
        code,
        type,
        value,
        usageLimit,
        validUntil,
        category,
        minimumPurchase,
        description,
        isActive
    };
    
    try {
        if (editingId) {
            await API.put(`/api/discounts/${editingId}`, discountData);
            showToast('Discount updated successfully', 'success');
        } else {
            await API.post('/api/discounts', discountData);
            showToast('Discount created successfully', 'success');
        }
        closeDiscountModal();
        loadDiscounts();
    } catch (error) {
        showToast(error.message || 'Failed to save discount', 'error');
    }
}

function openDeleteModal(id, code) {
    document.getElementById('deleteMessage').textContent = `Are you sure you want to delete the discount code "${code}"?`;
    document.getElementById('deleteModal').setAttribute('data-id', id);
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

async function confirmDelete() {
    const id = document.getElementById('deleteModal').getAttribute('data-id');
    
    try {
        await API.delete(`/api/discounts/${id}`);
        showToast('Discount deleted successfully', 'success');
        closeDeleteModal();
        loadDiscounts();
    } catch (error) {
        showToast('Failed to delete discount', 'error');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('discountModal');
    if (e.target === modal) {
        closeDiscountModal();
    }
    
    const deleteModal = document.getElementById('deleteModal');
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});
