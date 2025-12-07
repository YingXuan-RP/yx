// Categories management
let currentCategoryId = null;
let allCategories = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
        openAddCategoryModal();
    });

    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCategory();
    });

    // Search functionality
    document.getElementById('searchCategories').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = allCategories.filter(cat => 
            cat.name.toLowerCase().includes(searchTerm) || 
            (cat.description && cat.description.toLowerCase().includes(searchTerm))
        );
        currentPage = 1;
        displayCategories(filtered);
    });
}

async function loadCategories() {
    try {
        allCategories = await API.get('/api/categories');
        displayCategories(allCategories);
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Failed to load categories', 'error');
    }
}

function displayCategories(categories) {
    const tbody = document.getElementById('categoriesTable');
    
    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No categories found. Add your first category!</td></tr>';
        // Still show pagination even with 0 items
        renderPagination(1, categories);
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(categories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCategories = categories.slice(startIndex, endIndex);
    
    // Display categories
    tbody.innerHTML = paginatedCategories.map(category => `
        <tr>
            <td style="font-size: 24px;">${category.icon}</td>
            <td><strong>${category.name}</strong></td>
            <td>${category.description || '-'}</td>
            <td>
                <span class="badge badge-${category.isActive ? 'success' : 'secondary'}">
                    ${category.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${formatDate(category.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editCategory('${category._id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCategory('${category._id}', '${category.name}')">Delete</button>
            </td>
        </tr>
    `).join('');
    
    // Display pagination
    renderPagination(totalPages, categories);
}

function renderPagination(totalPages, categories) {
    const paginationContainer = document.getElementById('paginationContainer');
    const pagination = document.getElementById('pagination');
    
    // Always show pagination container
    paginationContainer.style.display = 'block';
    let html = '';
    
    // Previous button
    html += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1}, ${totalPages})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            ← Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i}, ${totalPages})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<span class="pagination-dots">...</span>';
        }
    }
    
    // Next button
    html += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1}, ${totalPages})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            Next →
        </button>
    `;
    
    pagination.innerHTML = html;
}

function changePage(page, totalPages) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    
    // Check if search is active
    const searchTerm = document.getElementById('searchCategories').value.toLowerCase();
    const categoriesToDisplay = searchTerm 
        ? allCategories.filter(cat => 
            cat.name.toLowerCase().includes(searchTerm) || 
            (cat.description && cat.description.toLowerCase().includes(searchTerm))
          )
        : allCategories;
    
    displayCategories(categoriesToDisplay);
}

function openAddCategoryModal() {
    currentCategoryId = null;
    document.getElementById('modalTitle').textContent = 'Add Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryIcon').value = '📦';
    document.getElementById('categoryActive').checked = true;
    openModal('categoryModal');
}

async function editCategory(id) {
    try {
        const category = await API.get(`/api/categories/${id}`);
        currentCategoryId = id;
        
        document.getElementById('modalTitle').textContent = 'Edit Category';
        document.getElementById('categoryId').value = category._id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categoryIcon').value = category.icon;
        document.getElementById('categoryActive').checked = category.isActive;
        
        openModal('categoryModal');
    } catch (error) {
        console.error('Error loading category:', error);
        showToast('Failed to load category', 'error');
    }
}

async function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value;
    const icon = document.getElementById('categoryIcon').value;
    const isActive = document.getElementById('categoryActive').checked;
    
    // Client-side validation
    if (!name) {
        showToast('Category name is required', 'error');
        return;
    }
    
    if (name.length < 2) {
        showToast('Category name must be at least 2 characters long', 'error');
        return;
    }
    
    const categoryData = { name, description, icon, isActive };
    
    try {
        let result;
        if (currentCategoryId) {
            result = await API.put(`/api/categories/${currentCategoryId}`, categoryData);
            showToast('Category updated successfully!');
        } else {
            result = await API.post('/api/categories', categoryData);
            showToast('Category created successfully!');
        }
        
        closeModal('categoryModal');
        loadCategories();
    } catch (error) {
        console.error('Error saving category:', error);
        const errorMessage = error.error || error.message || 'Failed to save category';
        showToast(errorMessage, 'error');
    }
}

async function deleteCategory(id, name) {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) {
        return;
    }
    
    try {
        const result = await API.delete(`/api/categories/${id}`);
        if (result.success) {
            showToast('Category deleted successfully!');
            loadCategories();
        } else {
            showToast(result.error || 'Failed to delete category', 'error');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Failed to delete category', 'error');
    }
}
