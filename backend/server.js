const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

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
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
    res.json({ 
        status: 'GB Mailer Backend Running',
        version: '1.0.0',
        endpoints: ['/', '/health', '/api/contacts', '/api/emails/send-bulk']
    });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================
// CONTACTS API
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
// EMAIL API
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
        
        res.json({ 
            success: true, 
            sent: contacts?.length || 0,
            total: contacts?.length || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// TEST ROUTE
// ============================================
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Routes are working!',
        routes: ['/', '/health', '/api/contacts', '/api/emails/send-bulk', '/test']
    });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`✅ GB Mailer Backend running on port ${PORT}`);
    console.log(`📍 Supabase: ${process.env.SUPABASE_URL}`);
});
