import { api } from './api.js';

// Navigation redirect logic
if (api.token && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
    window.location.href = 'dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const buildFallbackUser = (email, token) => ({
        _id: token,
        firstName: email.split('@')[0] || 'User',
        lastName: '',
        email,
        institution: '',
        degree: 'Student',
        major: ''
    });

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;

            const payload = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                institution: document.getElementById('institution').value.trim(),
                degree: document.getElementById('degree').value, // 1st year etc.
                major: document.getElementById('major').value.trim(),
            };

            try {
                const response = await api.post('/auth/register', payload);
                api.setToken(response.token);
                try {
                    const userRes = await api.get('/auth/me');
                    api.setCurrentUser(userRes.data);
                } catch (profileError) {
                    api.setCurrentUser(buildFallbackUser(payload.email, response.token));
                    console.warn('Profile fetch failed after registration:', profileError);
                }

                
                api.showToast('Registration successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } catch (error) {
                api.showToast(error.message, 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing In...';
            submitBtn.disabled = true;

            const payload = {
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
            };

            try {
                const response = await api.post('/auth/login', payload);
                api.setToken(response.token);
                try {
                    const userRes = await api.get('/auth/me');
                    api.setCurrentUser(userRes.data);
                } catch (profileError) {
                    api.setCurrentUser(buildFallbackUser(payload.email, response.token));
                    console.warn('Profile fetch failed after login:', profileError);
                    api.showToast('Logged in. Profile data will sync when connection is available.', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                    return;
                }


                api.showToast('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } catch (error) {
                api.showToast(error.message, 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Handle logout anywhere
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            logoutBtn.disabled = true;
            await api.clearToken();
            window.location.href = 'index.html';
        });
    }

});
