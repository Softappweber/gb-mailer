const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SMTP Transporter for Brevo
const smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Verify SMTP connection
smtpTransporter.verify(function(error, success) {
    if (error) {
        console.log('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to send emails');
    }
});

// Send single email endpoint
app.post('/api/send-email', async (req, res) => {
    try {
        const { to_email, to_name, from_email, from_name, subject, message_html, reply_to } = req.body;
        
        if (!to_email || !subject || !message_html) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const mailOptions = {
            from: `"${from_name || 'GB Mailer'}" <${from_email || process.env.EMAIL_FROM}>`,
            to: to_email,
            subject: subject,
            html: message_html,
            replyTo: reply_to || from_email || process.env.EMAIL_FROM
        };
        
        const info = await smtpTransporter.sendMail(mailOptions);
        
        res.json({ 
            success: true, 
            messageId: info.messageId,
            response: info.response 
        });
        
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Bulk email sending endpoint
app.post('/api/send-bulk-emails', async (req, res) => {
    try {
        const { contacts, from_email, from_name, subject, message_html, reply_to } = req.body;
        
        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ error: 'No contacts provided' });
        }
        
        let sentCount = 0;
        let failedCount = 0;
        const errors = [];
        
        for (const contact of contacts) {
            try {
                const personalizedHtml = message_html
                    .replace(/\{\{first_name\}\}/g, contact.first_name || '')
                    .replace(/\{\{last_name\}\}/g, contact.last_name || '')
                    .replace(/\{\{email\}\}/g, contact.email)
                    .replace(/\{\{company\}\}/g, contact.company || '');
                
                const personalizedSubject = subject
                    .replace(/\{\{first_name\}\}/g, contact.first_name || '')
                    .replace(/\{\{company\}\}/g, contact.company || '');
                
                const mailOptions = {
                    from: `"${from_name || 'GB Mailer'}" <${from_email || process.env.EMAIL_FROM}>`,
                    to: contact.email,
                    subject: personalizedSubject,
                    html: personalizedHtml,
                    replyTo: reply_to || from_email || process.env.EMAIL_FROM
                };
                
                await smtpTransporter.sendMail(mailOptions);
                sentCount++;
                
                // Small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Failed to send to ${contact.email}:`, error);
                failedCount++;
                errors.push({ email: contact.email, error: error.message });
            }
        }
        
        res.json({
            success: true,
            sentCount,
            failedCount,
            totalProcessed: contacts.length,
            errors: errors.slice(0, 10) // Return first 10 errors
        });
        
    } catch (error) {
        console.error('Bulk email error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Campaign creation endpoint
app.post('/api/campaigns', async (req, res) => {
    try {
        const { user_id, name, template_id, list_ids, provider, from_email, from_name, reply_to } = req.body;
        
        const { data: campaign, error } = await supabase
            .from('campaigns')
            .insert({
                user_id,
                name,
                template_id,
                list_ids,
                status: 'sending',
                provider,
                from_email,
                from_name,
                reply_to,
                total_recipients: 0,
                sent_count: 0,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, campaign });
        
    } catch (error) {
        console.error('Campaign creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get contacts by list IDs
app.post('/api/get-contacts', async (req, res) => {
    try {
        const { listIds } = req.body;
        
        if (!listIds || !Array.isArray(listIds) || listIds.length === 0) {
            return res.status(400).json({ error: 'No list IDs provided' });
        }
        
        // Get contact IDs from list_contacts
        const { data: listContacts, error: listError } = await supabase
            .from('list_contacts')
            .select('contact_id')
            .in('list_id', listIds);
        
        if (listError) throw listError;
        
        const contactIds = [...new Set(listContacts.map(lc => lc.contact_id))];
        
        if (contactIds.length === 0) {
            return res.json({ success: true, contacts: [] });
        }
        
        // Get contact details
        const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select('*')
            .in('id', contactIds)
            .eq('subscribed', true);
        
        if (contactsError) throw contactsError;
        
        res.json({ success: true, contacts: contacts || [] });
        
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'GB Mailer Backend'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'GB Mailer API',
        version: '1.0.0',
        endpoints: [
            '/api/send-email',
            '/api/send-bulk-emails',
            '/api/campaigns',
            '/api/get-contacts',
            '/health'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`GB Mailer backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
