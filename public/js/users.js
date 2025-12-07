// Users management
let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupSearchListener();
});

function setupSearchListener() {
    document.getElementById('searchUsers').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = allUsers.filter(user => 
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.username && user.username.toLowerCase().includes(searchTerm)) ||
            (user.telegramId && user.telegramId.toLowerCase().includes(searchTerm))
        );
        displayUsers(filtered);
    });
}

async function loadUsers() {
    try {
        allUsers = await API.get('/api/users');
        displayUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTable');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td><code>${user.telegramId}</code></td>
            <td>${user.firstName || ''} ${user.lastName || ''}</td>
            <td>${user.username ? '@' + user.username : '-'}</td>
            <td>${user.phoneNumber || '-'}</td>
            <td>
                <span class="badge badge-${user.isActive ? 'success' : 'secondary'}">
                    ${user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewUser('${user._id}')">View</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}', '${user.firstName || user.username || user.telegramId}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function viewUser(id) {
    try {
        const user = await API.get(`/api/users/${id}`);
        
        const detailsHtml = `
            <div class="details-grid">
                <div class="detail-item">
                    <strong>Telegram ID:</strong>
                    <span>${user.telegramId}</span>
                </div>
                <div class="detail-item">
                    <strong>Username:</strong>
                    <span>${user.username ? '@' + user.username : '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>First Name:</strong>
                    <span>${user.firstName || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>Last Name:</strong>
                    <span>${user.lastName || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>Phone Number:</strong>
                    <span>${user.phoneNumber || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>Address:</strong>
                    <span>${user.address || '-'}</span>
                </div>
                <div class="detail-item">
                    <strong>Status:</strong>
                    <span class="badge badge-${user.isActive ? 'success' : 'secondary'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="detail-item">
                    <strong>Joined:</strong>
                    <span>${formatDate(user.createdAt)}</span>
                </div>
                <div class="detail-item">
                    <strong>Last Activity:</strong>
                    <span>${formatDate(user.lastActivity)}</span>
                </div>
            </div>
        `;
        
        document.getElementById('userDetails').innerHTML = detailsHtml;
        openModal('userModal');
    } catch (error) {
        console.error('Error loading user:', error);
        showToast('Failed to load user details', 'error');
    }
}

async function deleteUser(id, name) {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const result = await API.delete(`/api/users/${id}`);
        if (result.success) {
            showToast('User deleted successfully!');
            loadUsers();
        } else {
            showToast(result.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user', 'error');
    }
}
