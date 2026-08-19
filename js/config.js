// GB Mailer Configuration
const GB_CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
    SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
    
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
        SMTP_INTEGRATION: true,
        MULTI_TENANT: false,
        API_ACCESS: false,
        WEBHOOKS: false
    },
    
    // Limits (for free tier)
    LIMITS: {
        FREE_CONTACTS: 500,
        FREE_EMAILS_PER_MONTH: 5000,
        FREE_LISTS: 5,
        FREE_TEMPLATES: 10,
        FREE_AUTOMATIONS: 3
    },
    
    // SMTP Configuration (for later)
    SMTP: {
        DEFAULT_HOST: '',
        DEFAULT_PORT: 587,
        DEFAULT_ENCRYPTION: 'tls'
    },
    
    // Analytics Settings
    ANALYTICS: {
        TRACK_OPENS: true,
        TRACK_CLICKS: true,
        TRACK_BOUNCES: true,
        TRACK_UNSUBSCRIBES: true
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GB_CONFIG;
}
