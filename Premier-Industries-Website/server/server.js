require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(express.json());

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (e.g. curl, server-to-server) and any listed origin
    if(!origin || allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1){
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// ---------- Email (Gmail SMTP via nodemailer, using an app password) ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// ---------- Routes ----------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Receive a new enquiry and email it straight to the owner (no storage)
app.post('/api/enquiry', async (req, res) => {
  try {
    const { name, company, email, phone, component, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.NOTIFY_EMAIL,
      replyTo: email, // lets the owner hit "reply" and go straight to the customer
      subject: `New enquiry from ${name}`,
      text: `
New enquiry received:

Name: ${name}
Company: ${company || '-'}
Email: ${email}
Phone: ${phone || '-'}
Component: ${component || '-'}
Message: ${message || '-'}
      `.trim()
    });

    console.log('Email sent successfully');
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Email send failed:', err.message);
    res.status(502).json({ error: 'Could not send your enquiry right now. Please try again.' });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
