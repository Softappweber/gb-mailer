// GB Mailer - Main Application JavaScript

// Global variables
window.currentUser = null;
window.currentModule = 'dashboard';
window.supabase = null;

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('GB Mailer initializing...');
    
    // Initialize Supabase
    try {
        window.supabase = supabase.createClient(
            window.CONFIG.SUPABASE_URL,
            window.CONFIG.SUPABASE_ANON_KEY
        );
        console.log('Supabase initialized');
    } catch (error) {
        console.error('Error initializing Supabase:', error);
    }
    
    // Initialize EmailJS
    try {
        if (window.CONFIG.EMAILJS.PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY') {
            emailjs.init(window.CONFIG.EMAILJS.PUBLIC_KEY);
            console.log('EmailJS initialized');
        } else {
            console.log('EmailJS not configured yet');
        }
    } catch (error) {
        console.error('Error initializing EmailJS:', error);
    }
    
    // Check if user is logged in
    await checkAuth();
});

// Check authentication
async function checkAuth() {
    try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (user) {
            window.currentUser = user;
            document.getElementById('userName').textContent = user.email.split('@')[0];
            loadModule('dashboard');
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        showLogin();
    }
}

// Show login form
function showLogin() {
    document.getElementById('mainContent').innerHTML = `
        <div class="auth-container">
            <h2><i class="bi bi-envelope-paper-heart"></i> GB Mailer</h2>
            <form class="auth-form" onsubmit="handleLogin(event)">
                <input type="email" class="form-control" id="loginEmail" placeholder="Email" required>
                <input type="password" class="form-control" id="loginPassword" placeholder="Password" required>
                <button type="submit" class="btn btn-gradient-primary">Login</button>
            </form>
            <div class="auth-link">
                <a href="#" onclick="showSignup()">Don't have an account? Sign up</a>
            </div>
        </div>
    `;
}

// Show signup form
function showSignup() {
    document.getElementById('mainContent').innerHTML = `
        <div class="auth-container">
            <h2><i class="bi bi-envelope-paper-heart"></i> GB Mailer</h2>
            <form class="auth-form" onsubmit="handleSignup(event)">
                <input type="email" class="form-control" id="signupEmail" placeholder="Email" required>
                <input type="password" class="form-control" id="signupPassword" placeholder="Password (min 6 characters)" required>
                <button type="submit" class="btn btn-gradient-primary">Sign Up</button>
            </form>
            <div class="auth-link">
                <a href="#" onclick="showLogin()">Already have an account? Login</a>
            </div>
        </div>
    `;
}

// Handle login
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        window.currentUser = data.user;
        document.getElementById('userName').textContent = data.user.email.split('@')[0];
        loadModule('dashboard');
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
};

// Handle signup
window.handleSignup = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    try {
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        alert('Signup successful! Please check your email to confirm your account.');
        showLogin();
        
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    }
};

// Handle logout
window.handleLogout = async function() {
    try {
        await window.supabase.auth.signOut();
        window.currentUser = null;
        document.getElementById('userName').textContent = 'User';
        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// Load module
window.loadModule = async function(moduleName) {
    console.log('Loading module:', moduleName);
    window.currentModule = moduleName;
    
    // Show loading
    window.showLoading();
    
    try {
        // Load module HTML
        const response = await fetch(`${moduleName}.html`);
        
        if (!response.ok) {
            throw new Error(`Failed to load module: ${moduleName}`);
        }
        
        const html = await response.text();
        
        // Update main content
        document.getElementById('mainContent').innerHTML = html;
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[onclick="loadModule('${moduleName}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Hide loading
        window.hideLoading();
        
        // Execute any scripts in the loaded module
        setTimeout(() => {
            const scripts = document.getElementById('mainContent').querySelectorAll('script');
            scripts.forEach(script => {
                try {
                    const newScript = document.createElement('script');
                    newScript.textContent = script.textContent;
                    script.parentNode.replaceChild(newScript, script);
                } catch (e) {
                    console.error('Error executing script:', e);
                }
            });
            
            // Trigger module-specific initialization
            if (moduleName === 'templates') {
                window.loadTemplates && window.loadTemplates();
            } else if (moduleName === 'campaigns') {
                window.loadCampaigns && window.loadCampaigns();
            } else if (moduleName === 'contacts') {
                window.loadContacts && window.loadContacts();
            } else if (moduleName === 'lists') {
                window.loadLists && window.loadLists();
            } else if (moduleName === 'settings') {
                window.loadSettings && window.loadSettings();
            }
        }, 100);
        
    } catch (error) {
        console.error('Error loading module:', error);
        window.hideLoading();
        
        document.getElementById('mainContent').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error loading module</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadModule('dashboard')">Go to Dashboard</button>
            </div>
        `;
    }
};

// Get current user
window.getCurrentUser = async function() {
    if (window.currentUser) {
        return window.currentUser;
    }
    
    try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        window.currentUser = user;
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

// Show loading
window.showLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
};

// Hide loading
window.hideLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
};

// Format date
window.formatDate = function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Show toast notification
window.showToast = function(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

// Export functions to window
window.checkAuth = checkAuth;
window.showLogin = showLogin;
window.showSignup = showSignup;
