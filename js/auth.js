// js/auth.js
const API_URL = 'https://gb-mailer-backend.onrender.com';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', checkAuth);

function checkAuth() {
    const token = localStorage.getItem('gbMailerToken');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!token && currentPage !== 'index.html') {
        window.location.href = 'index.html';
        return;
    }
    
    if (token && currentPage === 'index.html') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    if (token) {
        // Set user name
        const userData = JSON.parse(localStorage.getItem('gbMailerUser') || '{}');
        const userNameElement = document.getElementById('userName');
        if (userNameElement && userData.name) {
            userNameElement.textContent = userData.name;
        }
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('gbMailerToken', data.token);
            localStorage.setItem('gbMailerUser', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('loginError').textContent = data.message || 'Login failed';
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'Connection error. Please try again.';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        document.getElementById('registerError').textContent = 'Passwords do not match';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Auto login after registration
            handleLogin(new Event('submit'));
        } else {
            document.getElementById('registerError').textContent = data.message || 'Registration failed';
        }
    } catch (error) {
        document.getElementById('registerError').textContent = 'Connection error. Please try again.';
    }
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

function logout() {
    localStorage.removeItem('gbMailerToken');
    localStorage.removeItem('gbMailerUser');
    window.location.href = 'index.html';
}

// Attach event listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});
