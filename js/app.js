// Supabase Configuration
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
let currentUser = null;
let currentModule = 'dashboard';
let sidebarCollapsed = false;

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const loginScreen = document.getElementById('loginScreen');
const signupScreen = document.getElementById('signupScreen');
const mainApp = document.getElementById('mainApp');
const contentArea = document.getElementById('contentArea');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupEventListeners();
});

// Check for existing session
async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            await loadMainApp();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Session check error:', error);
        showLogin();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Login
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('showSignup').addEventListener('click', (e) => {
        e.preventDefault();
        showSignup();
    });
    
    // Signup
    document.getElementById('signupBtn').addEventListener('click', handleSignup);
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Sidebar Toggle
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Navigation
    document.querySelectorAll('.nav-link[data-module]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const module = link.dataset.module;
            navigateToModule(module);
        });
    });
}

// Handle Login
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await loadMainApp();
        showToast('Welcome back!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle Signup
async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        if (data.user) {
            currentUser = data.user;
            await loadMainApp();
            showToast('Account created successfully!', 'success');
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle Logout
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        showLogin();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Toggle Sidebar
function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        document.querySelector('.main-content').classList.add('expanded');
    } else {
        sidebar.classList.remove('collapsed');
        document.querySelector('.main-content').classList.remove('expanded');
    }
}

// Navigate to Module
async function navigateToModule(module) {
    currentModule = module;
    
    // Update active nav link
    document.querySelectorAll('.nav-link[data-module]').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.module === module) {
            link.classList.add('active');
        }
    });
    
    // Load module content
    try {
        showLoading(true);
        const response = await fetch(`modules/${module}.html`);
        if (!response.ok) throw new Error('Module not found');
        
        const html = await response.text();
        contentArea.innerHTML = html;
        
        // Initialize module-specific scripts
        initializeModule(module);
    } catch (error) {
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error loading module</h4>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// Initialize Module-specific functionality
function initializeModule(module) {
    switch(module) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'templates':
            loadTemplates();
            break;
        case 'campaigns':
            loadCampaigns();
            break;
        case 'automation':
            loadAutomations();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'lists':
            loadLists();
            break;
        case 'scoring':
            loadScoringRules();
            break;
        case 'reports':
            loadReports();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Show/Hide Screens
function showLogin() {
    loadingScreen.classList.add('d-none');
    signupScreen.classList.add('d-none');
    mainApp.classList.add('d-none');
    loginScreen.classList.remove('d-none');
}

function showSignup() {
    loadingScreen.classList.add('d-none');
    loginScreen.classList.add('d-none');
    mainApp.classList.add('d-none');
    signupScreen.classList.remove('d-none');
}

async function loadMainApp() {
    loadingScreen.classList.add('d-none');
    loginScreen.classList.add('d-none');
    signupScreen.classList.add('d-none');
    mainApp.classList.remove('d-none');
    
    // Update user info
    updateUserInfo();
    
    // Load default module
    await navigateToModule('dashboard');
}

function updateUserInfo() {
    if (currentUser) {
        const name = currentUser.user_metadata?.full_name || 'User';
        const email = currentUser.email;
        const initial = name.charAt(0).toUpperCase();
        
        document.getElementById('userName').textContent = name;
        document.getElementById('userEmail').textContent = email;
        document.getElementById('userAvatar').textContent = initial;
    }
}

// Show Loading
function showLoading(show) {
    loadingScreen.classList.toggle('d-none', !show);
}

// Toast Notification
function showToast(message, type = 'info') {
    const toastContainer = document.createElement('div');
    toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
    `;
    
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'}`;
    toast.style.cssText = `
        min-width: 300px;
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toastContainer);
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Module Functions (will be implemented in subsequent steps)
function loadDashboardData() {
    // TODO: Implement dashboard data loading
    console.log('Loading dashboard data...');
}

function loadContacts() {
    // TODO: Implement contacts loading
    console.log('Loading contacts...');
}

function loadTemplates() {
    // TODO: Implement templates loading
    console.log('Loading templates...');
}

function loadCampaigns() {
    // TODO: Implement campaigns loading
    console.log('Loading campaigns...');
}

function loadAutomations() {
    // TODO: Implement automations loading
    console.log('Loading automations...');
}

function loadAnalytics() {
    // TODO: Implement analytics loading
    console.log('Loading analytics...');
}

function loadLists() {
    // TODO: Implement lists loading
    console.log('Loading lists...');
}

function loadScoringRules() {
    // TODO: Implement scoring rules loading
    console.log('Loading scoring rules...');
}

function loadReports() {
    // TODO: Implement reports loading
    console.log('Loading reports...');
}

function loadSettings() {
    // TODO: Implement settings loading
    console.log('Loading settings...');
}
