// Products management
let currentProductId = null;
let categories = [];
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCategoriesForSelect();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('addProductBtn').addEventListener('click', () => {
        showAddProductView();
    });

    // Image preview
    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('previewImg').src = e.target.result;
                    document.getElementById('mediaPreview').style.display = 'block';
                    document.getElementById('mediaUploadBox').style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Search functionality
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allProducts.filter(prod => 
                prod.name.toLowerCase().includes(searchTerm) || 
                (prod.description && prod.description.toLowerCase().includes(searchTerm)) ||
                (prod.category && prod.category.name.toLowerCase().includes(searchTerm))
            );
            displayProducts(filtered);
        });
    }
}

function showAddProductView() {
    document.getElementById('productsListView').style.display = 'none';
    document.getElementById('addProductView').style.display = 'block';
    document.querySelector('.content-header h1').textContent = 'Add product';
    document.getElementById('addProductBtn').style.display = 'none';
    resetProductForm();
}

function cancelAddProduct() {
    document.getElementById('productsListView').style.display = 'block';
    document.getElementById('addProductView').style.display = 'none';
    document.querySelector('.content-header h1').textContent = 'Products';
    document.getElementById('addProductBtn').style.display = 'block';
    resetProductForm();
}

function resetProductForm() {
    document.getElementById('productTitle').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '0';
    document.getElementById('productCategory').value = '';
    document.getElementById('productVendor').value = '';
    document.getElementById('productTags').value = '';
    document.getElementById('productStatus').value = 'active';
    document.getElementById('productWeight').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('mediaPreview').style.display = 'none';
    document.getElementById('mediaUploadBox').style.display = 'flex';
}

function removeMedia() {
    document.getElementById('productImage').value = '';
    document.getElementById('mediaPreview').style.display = 'none';
    document.getElementById('mediaUploadBox').style.display = 'flex';
}

async function loadCategoriesForSelect() {
    try {
        categories = await API.get('/api/categories');
        const select = document.getElementById('productCategory');
        select.innerHTML = '<option value="">Select category...</option>' + 
            categories.map(cat => `<option value="${cat._id}">${cat.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts() {
    try {
        allProducts = await API.get('/api/products');
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('productsTable');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products found. Add your first product!</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                ${product.imageUrl 
                    ? `<img src="${product.imageUrl}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` 
                    : '<div style="width: 50px; height: 50px; background: #e0e0e0; border-radius: 4px; display: flex; align-items: center; justify-content: center;">📦</div>'
                }
            </td>
            <td><strong>${product.name}</strong></td>
            <td>${product.category ? product.category.name : 'N/A'}</td>
            <td><strong>${formatCurrency(product.price)}</strong></td>
            <td>${product.stock}</td>
            <td>
                <span class="badge badge-${product.isAvailable ? 'success' : 'secondary'}">
                    ${product.isAvailable ? 'Available' : 'Unavailable'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editProduct('${product._id}')">Edit</button>
                <button class="btn btn-sm btn-${product.isAvailable ? 'warning' : 'success'}" onclick="toggleAvailability('${product._id}')">
                    ${product.isAvailable ? 'Disable' : 'Enable'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}', '${product.name}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openAddProductModal() {
    currentProductId = null;
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productAvailable').checked = true;
    document.getElementById('imagePreview').style.display = 'none';
    openModal('productModal');
}

async function editProduct(id) {
    try {
        const product = await API.get(`/api/products/${id}`);
        currentProductId = id;
        
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product._id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category._id;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productSku').value = product.sku || '';
        document.getElementById('productTags').value = product.tags ? product.tags.join(', ') : '';
        document.getElementById('productAvailable').checked = product.isAvailable;
        
        if (product.imageUrl) {
            document.getElementById('previewImg').src = product.imageUrl;
            document.getElementById('imagePreview').style.display = 'block';
        } else {
            document.getElementById('imagePreview').style.display = 'none';
        }
        
        openModal('productModal');
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Failed to load product', 'error');
    }
}

async function saveProduct() {
    const name = document.getElementById('productTitle').value.trim();
    const price = document.getElementById('productPrice').value;
    const stock = document.getElementById('productStock').value;
    const category = document.getElementById('productCategory').value;
    
    // Client-side validation
    if (!name) {
        showToast('Product title is required', 'error');
        return;
    }
    
    if (!price || isNaN(price)) {
        showToast('Valid price is required', 'error');
        return;
    }
    
    if (parseFloat(price) < 0) {
        showToast('Price cannot be negative. Please enter a valid positive price.', 'error');
        return;
    }
    
    if (!category) {
        showToast('Please select a category', 'error');
        return;
    }
    
    if (stock && parseInt(stock) < 0) {
        showToast('Stock quantity cannot be negative. Please enter a valid positive quantity.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('stock', stock);
    formData.append('sku', '');
    formData.append('tags', document.getElementById('productTags').value);
    formData.append('isAvailable', document.getElementById('productStatus').value === 'active');
    
    const imageFile = document.getElementById('productImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        let result;
        if (currentProductId) {
            result = await API.putFormData(`/api/products/${currentProductId}`, formData);
            showToast('Product updated successfully!');
        } else {
            result = await API.postFormData('/api/products', formData);
            showToast('Product created successfully!');
        }
        
        cancelAddProduct();
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        const errorMessage = error.error || error.message || 'Failed to save product';
        showToast(errorMessage, 'error');
    }
}

async function toggleAvailability(id) {
    try {
        await API.patch(`/api/products/${id}/toggle-availability`, {});
        showToast('Product availability updated!');
        loadProducts();
    } catch (error) {
        console.error('Error toggling availability:', error);
        showToast('Failed to update availability', 'error');
    }
}

async function deleteProduct(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }
    
    try {
        const result = await API.delete(`/api/products/${id}`);
        if (result.success) {
            showToast('Product deleted successfully!');
            loadProducts();
        } else {
            showToast(result.error || 'Failed to delete product', 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product', 'error');
    }
}
