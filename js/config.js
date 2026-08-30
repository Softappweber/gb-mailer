// GB Mailer Configuration
window.CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://cqvcdbnkmtgdpnldeejq.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_Xut2MmJFXb0QJPJgC1lVbg_0206dtlU',
    
    // Backend URL (Render)
    BACKEND_URL: 'https://gb-mailer-backend.onrender.com',
    
    // EmailJS Configuration
    EMAILJS: {
        SERVICE_ID: 'service_ogrqrgs', // Get from EmailJS dashboard
        TEMPLATE_ID: 'template_2dnmc2h', // Get from EmailJS dashboard
        PUBLIC_KEY: '0eRq16_I94xMRC97a' // Get from EmailJS dashboard
    },
    
    // SMTP Configuration (for later use)
    SMTP: {
        HOST: 'smtp-relay.brevo.com',
        PORT: 587,
        USERNAME: 'sushantkadam75@gmail.com',
        PASSWORD: 'xsmtpsib-6d6909a60b280e2dd692d36f123c421836f068952551b20fe6dea0ae993e6caa-MVnLpIXm2C9F7Dk7',
        FROM_EMAIL: 'sushantkadam75@gmail.com',
        FROM_NAME: 'GB Mailer'
    },
    
    // App Settings
    APP_NAME: 'GB Mailer',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'Professional Email Marketing Platform',
    
    // Feature Flags
    FEATURES: {
        CONTACT_MANAGEMENT: true,
        EMAIL_TEMPLATES: true,
        CAMPAIGN_MANAGEMENT: true,
        AUTOMATION: true,
        ANALYTICS: true,
        LEAD_SCORING: true,
        REPORTS: true,
        SMTP_INTEGRATION: true
    },
    
    // Limits (for free tier)
    LIMITS: {
        FREE_CONTACTS: 500,
        FREE_EMAILS_PER_MONTH: 5000,
        FREE_LISTS: 5,
        FREE_TEMPLATES: 10,
        FREE_AUTOMATIONS: 3
    }
};

// For backward compatibility
const GB_CONFIG = window.CONFIG;
