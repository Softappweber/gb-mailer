-- GB Mailer Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extended profile)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'free',
    credits_used INT DEFAULT 0,
    credits_limit INT DEFAULT 5000,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    company VARCHAR(255),
    job_title VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    subscribed BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT NOW(),
    unsubscribed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, email)
);

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50) DEFAULT '#e94560',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- List contacts junction table
CREATE TABLE IF NOT EXISTS list_contacts (
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (list_id, contact_id)
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    preheader_text VARCHAR(500),
    content_html TEXT NOT NULL,
    content_text TEXT,
    variables TEXT[] DEFAULT '{}',
    category VARCHAR(100) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    template_id UUID REFERENCES email_templates(id),
    list_ids UUID[] DEFAULT '{}',
    segment_config JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    schedule_type VARCHAR(50) DEFAULT 'immediate',
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    completed_at TIMESTAMP,
    total_recipients INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    open_count INT DEFAULT 0,
    click_count INT DEFAULT 0,
    bounce_count INT DEFAULT 0,
    unsubscribe_count INT DEFAULT 0,
    spam_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email tracking table
CREATE TABLE IF NOT EXISTS email_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id),
    contact_id UUID REFERENCES contacts(id),
    email VARCHAR(255) NOT NULL,
    message_id VARCHAR(500),
    status VARCHAR(50),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    spam_at TIMESTAMP,
    open_count INT DEFAULT 0,
    click_count INT DEFAULT 0,
    user_agent TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Automation rules table
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_config JSONB,
    action_type VARCHAR(100) NOT NULL,
    action_config JSONB,
    delay_minutes INT DEFAULT 0,
    delay_type VARCHAR(50) DEFAULT 'minutes',
    is_active BOOLEAN DEFAULT TRUE,
    run_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead scoring rules table
CREATE TABLE IF NOT EXISTS scoring_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contact scores table
CREATE TABLE IF NOT EXISTS contact_scores (
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    total_score INT DEFAULT 0,
    engagement_score INT DEFAULT 0,
    behavior_score INT DEFAULT 0,
    last_calculated TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (contact_id)
);

-- SMTP settings table
CREATE TABLE IF NOT EXISTS smtp_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    host VARCHAR(255),
    port INT,
    username VARCHAR(255),
    password VARCHAR(255),
    encryption VARCHAR(50) DEFAULT 'tls',
    from_name VARCHAR(255),
    from_email VARCHAR(255),
    reply_to VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    report_data JSONB,
    date_range_start DATE,
    date_range_end DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_tracking_campaign_id ON email_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_contact_id ON email_tracking(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON email_tracking(status);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Create views for common queries
CREATE OR REPLACE VIEW contact_list_view AS
SELECT 
    c.id,
    c.user_id,
    c.email,
    c.first_name,
    c.last_name,
    c.company,
    c.tags,
    c.status,
    c.created_at,
    COUNT(lc.list_id) as list_count
FROM contacts c
LEFT JOIN list_contacts lc ON c.id = lc.contact_id
GROUP BY c.id;

CREATE OR REPLACE VIEW campaign_stats_view AS
SELECT 
    c.id,
    c.name,
    c.status,
    c.total_recipients,
    c.delivered_count,
    c.open_count,
    c.click_count,
    c.bounce_count,
    CASE 
        WHEN c.delivered_count > 0 THEN 
            ROUND((c.open_count::numeric / c.delivered_count) * 100, 2)
        ELSE 0 
    END as open_rate,
    CASE 
        WHEN c.delivered_count > 0 THEN 
            ROUND((c.click_count::numeric / c.delivered_count) * 100, 2)
        ELSE 0 
    END as click_rate
FROM campaigns c;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lists_updated_at
    BEFORE UPDATE ON lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Create RLS (Row Level Security) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...
-- (Add more policies as needed)

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
