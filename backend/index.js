// backend/index.js (update your main file)
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const authenticateToken = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Auth routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/contacts', authenticateToken, contactsRoutes);
app.use('/api/emails', authenticateToken, emailRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
