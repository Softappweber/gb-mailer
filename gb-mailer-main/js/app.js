// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        const { data: { session }, error } = await gbSupabase.getSession();
        
        if (session) {
            gbApp.currentUser = session.user;
            await gbApp.loadMainApp();
        } else {
            gbApp.showScreen('login');
        }
    } catch (error) {
        console.error('Session check error:', error);
        gbApp.showScreen('login');
    }
}

class GBMailerApp {
    constructor() {
        this.currentUser = null;
        this.currentModule = 'dashboard';
        this.sidebarCollapsed = false;
        this.toastContainer = null;
        
        this.elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            loginScreen: document.getElementById('loginScreen'),
            signupScreen: document.getElementById('signupScreen'),
            mainApp: document.getElementById('mainApp'),
            contentArea: document.getElementById('contentArea'),
            sidebar: document.getElementById('sidebar'),
            sidebarToggle: document.getElementById('sidebarToggle')
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('signupBtn')?.addEventListener('click', () => this.handleSignup());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        document.getElementById('showSignup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('signup');
        });
        
        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('login');
        });
        
        this.elements.sidebarToggle?.addEventListener('click', () => this.toggleSidebar());
        
        document.querySelectorAll('.nav-link[data-module]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToModule(link.dataset.module);
            });
        });
    }
    
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showToast('Please enter email and password', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            const { data, error } = await gbSupabase.signIn(email, password);
            if (error) throw error;
            
            this.currentUser = data.user;
            await this.loadMainApp();
            this.showToast('Welcome back!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
            this.showLoading(false);
        }
    }
    
    async handleSignup() {
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        
        if (!name || !email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            const { data, error } = await gbSupabase.signUp(email, password, {
                full_name: name,
                plan: 'free'
            });
            if (error) throw error;
            
            if (data.user) {
                this.currentUser = data.user;
                await this.loadMainApp();
                this.showToast('Account created successfully!', 'success');
            }
        } catch (error) {
            this.showToast(error.message, 'error');
            this.showLoading(false);
        }
    }
    
    async handleLogout() {
        try {
            const { error } = await gbSupabase.signOut();
            if (error) throw error;
            this.currentUser = null;
            this.showScreen('login');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        if (this.sidebarCollapsed) {
            this.elements.sidebar.classList.add('collapsed');
            document.querySelector('.main-content').classList.add('expanded');
        } else {
            this.elements.sidebar.classList.remove('collapsed');
            document.querySelector('.main-content').classList.remove('expanded');
        }
    }
    
    async navigateToModule(module) {
        this.currentModule = module;
        
        document.querySelectorAll('.nav-link[data-module]').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.module === module) {
                link.classList.add('active');
            }
        });
        
        try {
            const response = await fetch(`modules/${module}.html`);
            if (!response.ok) throw new Error('Module not found');
            
            const html = await response.text();
            this.elements.contentArea.innerHTML = html;
            
            // Execute scripts
            const scripts = this.elements.contentArea.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
            
            this.initializeModule(module);
        } catch (error) {
            this.elements.contentArea.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error loading module</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    initializeModule(module) {
        const initializers = {
            'dashboard': () => { if (typeof loadDashboardData === 'function') loadDashboardData(); },
            'contacts': () => { if (typeof initContactsModule === 'function') initContactsModule(); },
            'lists': () => { if (typeof initListsModule === 'function') initListsModule(); },
            'templates': () => { if (typeof initTemplatesModule === 'function') initTemplatesModule(); },
            'campaigns': () => { if (typeof initCampaignsModule === 'function') initCampaignsModule(); },
            'automation': () => { if (typeof initAutomationModule === 'function') initAutomationModule(); },
            'analytics': () => { if (typeof initAnalyticsModule === 'function') initAnalyticsModule(); },
            'scoring': () => { if (typeof initScoringModule === 'function') initScoringModule(); },
            'reports': () => { if (typeof initReportsModule === 'function') initReportsModule(); },
            'settings': () => { if (typeof initSettingsModule === 'function') initSettingsModule(); }
        };
        
        if (initializers[module]) {
            initializers[module]();
        }
    }
    
    showScreen(screen) {
        const screens = {
            loading: this.elements.loadingScreen,
            login: document.getElementById('loginScreen'),
            signup: document.getElementById('signupScreen'),
            main: this.elements.mainApp
        };
        
        Object.values(screens).forEach(s => s?.classList.add('d-none'));
        
        if (screens[screen]) {
            screens[screen].classList.remove('d-none');
        }
    }
    
    showLoading(show) {
        if (show) {
            this.elements.loadingScreen.classList.remove('d-none');
        } else {
            this.elements.loadingScreen.classList.add('d-none');
        }
    }
    
    async loadMainApp() {
        this.showScreen('main');
        this.showLoading(false);
        this.updateUserInfo();
        await this.navigateToModule('dashboard');
    }
    
    updateUserInfo() {
        if (this.currentUser) {
            const name = this.currentUser.user_metadata?.full_name || 'User';
            const email = this.currentUser.email;
            const initial = name.charAt(0).toUpperCase();
            
            document.getElementById('userName').textContent = name;
            document.getElementById('userEmail').textContent = email;
            document.getElementById('userAvatar').textContent = initial;
        }
    }
    
    showToast(message, type = 'info') {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
            document.body.appendChild(this.toastContainer);
        }
        
        const toast = document.createElement('div');
        const typeClasses = {
            'error': 'alert-danger',
            'success': 'alert-success',
            'warning': 'alert-warning',
            'info': 'alert-info'
        };
        
        toast.className = `alert ${typeClasses[type] || 'alert-info'}`;
        toast.style.cssText = 'min-width: 300px; padding: 15px 20px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode === this.toastContainer) {
                this.toastContainer.removeChild(toast);
            }
        }, 3000);
    }
}

const gbApp = new GBMailerApp();

window.gbApp = gbApp;
window.navigateToModule = (module) => gbApp.navigateToModule(module);
window.showToast = (message, type) => gbApp.showToast(message, type);
window.handleLogout = () => gbApp.handleLogout();
