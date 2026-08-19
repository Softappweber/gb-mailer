// GB Mailer Configuration
const GB_CONFIG = {
    // Supabase Configuration - UPDATE THESE LATER
    SUPABASE_URL: 'https://cqvcdbnkmtgdpnldeejq.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_Xut2MmJFXb0QJPJgC1lVbg_0206dtlU',
    
    // Backend URL (Render) - UPDATE LATER
    BACKEND_URL: 'https://your-backend.onrender.com',
    
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
