// Common utilities and functions
const API = {
    async get(url) {
        const response = await fetch(url);
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        if (!response.ok) {
            const error = await response.json();
            throw error;
        }
        return response.json();
    },

    async post(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        const result = await response.json();
        if (!response.ok) {
            throw result;
        }
        return result;
    },

    async postFormData(url, formData) {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        const result = await response.json();
        if (!response.ok) {
            throw result;
        }
        return result;
    },

    async put(url, data) {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        const result = await response.json();
        if (!response.ok) {
            throw result;
        }
        return result;
    },

    async putFormData(url, formData) {
        const response = await fetch(url, {
            method: 'PUT',
            body: formData
        });
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        const result = await response.json();
        if (!response.ok) {
            throw result;
        }
        return result;
    },

    async delete(url) {
        const response = await fetch(url, {
            method: 'DELETE'
        });
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        const result = await response.json();
        if (!response.ok) {
            throw result;
        }
        return result;
    },

    async patch(url, data) {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }
        return response.json();
    }
};

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await API.post('/api/auth/logout', {});
                window.location.href = '/login';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '/login';
            }
        });
    }

    // Load admin name
    loadAdminInfo();
});

async function loadAdminInfo() {
    try {
        const data = await API.get('/api/auth/check');
        if (data.authenticated && data.admin) {
            const adminNameEl = document.getElementById('adminName');
            if (adminNameEl) {
                adminNameEl.textContent = data.admin.name || data.admin.email;
            }
        }
    } catch (error) {
        console.error('Error loading admin info:', error);
    }
}

// Modal utilities
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format currency
function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Update notification badge with stock alerts
async function updateNotificationBadge() {
    try {
        const products = await API.get('/api/products');
        const outOfStock = products.filter(p => p.stock === 0);
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10);
        const totalAlerts = outOfStock.length + lowStock.length;
        
        const badge = document.getElementById('notificationBadge');
        const bell = document.getElementById('notificationBell');
        
        if (badge && totalAlerts > 0) {
            badge.textContent = totalAlerts;
            badge.style.display = 'block';
            
            // Add click handler to show alert details
            if (bell && !bell.hasAttribute('data-listener')) {
                bell.setAttribute('data-listener', 'true');
                bell.addEventListener('click', () => {
                    let message = '';
                    if (outOfStock.length > 0) {
                        message += `Out of stock: ${outOfStock.map(p => p.name).join(', ')}\\n`;
                    }
                    if (lowStock.length > 0) {
                        message += `Low stock: ${lowStock.map(p => `${p.name} (${p.stock})`).join(', ')}`;
                    }
                    alert(message);
                });
            }
        } else if (badge) {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
}

// Setup modal close handlers
document.addEventListener('DOMContentLoaded', () => {
    // Update notification badge on page load
    updateNotificationBadge();
    
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const closeButtons = modal.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Handle dropdown navigation toggle
    const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = toggle.closest('.nav-dropdown');
            dropdown.classList.toggle('open');
        });
    });
});
