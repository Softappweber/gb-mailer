require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: 'GB Mailer Backend Running' });
});

// Test endpoint (no email sending yet)
app.get('/test', (req, res) => {
    res.json({ message: 'Backend is alive!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
