// ============================================
// GB MAILER - SHARED APP LOGIC
// ============================================

const API_URL = 'https://gb-mailer-backend.onrender.com';

// ============================================
// AUTHENTICATION
// ============================================

function checkAuth() {
    const token = localStorage.getItem('gb_mailer_token');
    const currentPage = window.location.pathname.split('/').pop();
    const authPages = ['index.html', 'login.html', 'signup.html'];
    
    if (!token && !authPages.includes(currentPage)) {
        window.location.href = '/gb-mailer/index.html';
        return false;
    }
    return true;
}

function getCurrentUser() {
    const user = localStorage.getItem('gb_mailer_user');
    return user ? JSON.parse(user) : null;
}

function handleLogout() {
    if (!confirm('Logout?')) return;
    localStorage.removeItem('gb_mailer_token');
    localStorage.removeItem('gb_mailer_user');
    window.location.href = '/gb-mailer/index.html';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showAlert(message, type = 'error') {
    const alert = document.getElementById('alert');
    if (!alert) return;
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    setTimeout(() => {
        alert.className = 'alert hidden';
    }, 5000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ============================================
// API HELPERS
// ============================================

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('gb_mailer_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    return response.json();
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Check auth on all pages except index
    if (!window.location.pathname.includes('index.html')) {
        checkAuth();
    }
});
