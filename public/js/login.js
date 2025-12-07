// Login functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btnText = document.querySelector('.btn-text');
        const btnLoader = document.querySelector('.btn-loader');
        
        // Show loading state
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        errorMessage.style.display = 'none';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                // Show error message
                errorMessage.textContent = data.error || 'Login failed';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Network error. Please try again.';
            errorMessage.style.display = 'block';
        } finally {
            // Reset button state
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
});
