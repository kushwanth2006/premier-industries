require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // fixes querySrv ECONNREFUSED on networks whose DNS blocks SRV lookups

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Resend } = require('resend');
const Enquiry = require('./models/Enquiry');

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

// ---------- MongoDB ----------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// ---------- Email (Resend — HTTP API, avoids SMTP ports blocked on some hosts) ----------
const resend = new Resend(process.env.RESEND_API_KEY);

// ---------- Routes ----------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create a new enquiry
app.post('/api/enquiry', async (req, res) => {
  try {
    const { name, company, email, phone, component, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    // 1. Save to MongoDB
    const enquiry = await Enquiry.create({ name, company, email, phone, component, message });

    // 2. Send email notification via Resend (does not block the response if it fails)
    resend.emails.send({
      from: 'Enquiry Bot <onboarding@resend.dev>',
      to: process.env.NOTIFY_EMAIL,
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
    }).catch(err => console.error('Email send failed:', err.message));

    res.status(201).json({ success: true, enquiry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// (Optional) list all enquiries — useful for testing / a future admin page
app.get('/api/enquiry', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch enquiries.' });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
