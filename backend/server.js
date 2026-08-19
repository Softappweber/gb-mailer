const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// SUPABASE CLIENT
// ============================================
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ============================================
// EMAIL (BREVO SMTP)
// ============================================
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.sendinblue.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// ============================================
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
    res.json({ status: 'GB Mailer Backend Running' });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// CONTACTS - GET ALL
// ============================================
app.get('/api/contacts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        
        let query = supabase.from('contacts').select('*', { count: 'exact' });
        
        if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
        }
        
        const start = (page - 1) * limit;
        const { data, count, error } = await query
            .range(start, start + limit - 1)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({
            data: data || [],
            total: count || 0,
            page: page,
            total_pages: count ? Math.ceil(count / limit) : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// CONTACTS - PREVIEW FILE
// ============================================
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/contacts/preview', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        
        res.json({
            columns: Object.keys(data[0] || {}),
            preview: data.slice(0, 3)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// CONTACTS - UPLOAD
// ============================================
app.post('/api/contacts/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const mapping = JSON.parse(req.body.mapping || '{}');
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        
        const contacts = [];
        for (const row of rows) {
            const contact = {
                id: uuidv4(),
                custom_fields: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const fieldMap = {
                'first_name': 'first_name',
                'last_name': 'last_name',
                'email': 'email',
                'phone': 'phone',
                'company': 'company',
                'job_title': 'job_title'
            };
            
            for (const [field, colName] of Object.entries(fieldMap)) {
                if (mapping[colName] && row[mapping[colName]] !== undefined && row[mapping[colName]] !== '') {
                    contact[field] = String(row[mapping[colName]]).trim();
                }
            }
            
            for (const col of Object.keys(row)) {
                if (!Object.values(mapping).includes(col) && row[col] !== '' && row[col] !== undefined) {
                    contact.custom_fields[col] = String(row[col]).trim();
                }
            }
            
            contacts.push(contact);
        }
        
        if (contacts.length > 0) {
            const { error } = await supabase.from('contacts').insert(contacts);
            if (error) throw error;
        }
        
        res.json({
            success: true,
            message: `Uploaded ${contacts.length} contacts`,
            total: contacts.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// CONTACTS - DELETE
// ============================================
app.delete('/api/contacts/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// EMAILS - SEND BULK
// ============================================
app.post('/api/emails/send-bulk', async (req, res) => {
    try {
        const { contact_ids, subject, body } = req.body;
        
        if (!contact_ids || contact_ids.length === 0) {
            return res.status(400).json({ error: 'No contacts selected' });
        }
        
        const { data: contacts, error } = await supabase
            .from('contacts')
            .select('*')
            .in('id', contact_ids);
        
        if (error) throw error;
        
        if (!contacts || contacts.length === 0) {
            return res.status(404).json({ error: 'No contacts found' });
        }
        
        const results = { sent: [], failed: [] };
        
        for (const contact of contacts) {
            try {
                let personalizedBody = body;
                const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
                
                const replacements = {
                    '{{first_name}}': contact.first_name || '',
                    '{{last_name}}': contact.last_name || '',
                    '{{full_name}}': fullName,
                    '{{email}}': contact.email || '',
                    '{{phone}}': contact.phone || '',
                    '{{company}}': contact.company || '',
                    '{{job_title}}': contact.job_title || ''
                };
                
                for (const [key, value] of Object.entries(replacements)) {
                    personalizedBody = personalizedBody.replace(new RegExp(key, 'g'), value);
                }
                
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: contact.email,
                    subject: subject,
                    html: personalizedBody
                });
                
                results.sent.push(contact.id);
                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (err) {
                results.failed.push({
                    id: contact.id,
                    email: contact.email,
                    error: err.message
                });
            }
        }
        
        res.json({
            success: true,
            sent: results.sent.length,
            failed: results.failed,
            total: contacts.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// EMAILS - TEST
// ============================================
app.post('/api/emails/test', async (req, res) => {
    try {
        const { test_email } = req.body;
        const to = test_email || process.env.EMAIL_FROM;
        
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: '✅ SMTP Test - GB Mailer',
            html: `
                <h1 style="color:#28a745;">SMTP Configuration Working!</h1>
                <p>Your Brevo SMTP is configured correctly.</p>
                <hr>
                <p style="color:#6c757d;font-size:12px;">Sent from GB Mailer</p>
            `
        });
        
        res.json({
            success: true,
            message: `Test email sent to ${to}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// TEST ROUTE
// ============================================
app.get('/test', (req, res) => {
    res.json({ message: 'Routes are working!' });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`✅ GB Mailer Backend running on port ${PORT}`);
    console.log(`📍 Supabase: ${process.env.SUPABASE_URL}`);
});
