require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // fixes querySrv ECONNREFUSED on networks whose DNS blocks SRV lookups
dns.setDefaultResultOrder('ipv4first'); // fixes SMTP ETIMEDOUT caused by Node preferring IPv6 on some hosts

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Enquiry = require('./models/Enquiry');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));

// ---------- MongoDB ----------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// ---------- Email transporter ----------
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true, // true for port 465
  family: 4, // force IPv4 — avoids ETIMEDOUT on hosts where outbound IPv6 to Gmail doesn't route
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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

    // 2. Send email notification (does not block the response if it fails)
    transporter.sendMail({
      from: process.env.EMAIL_USER,
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
