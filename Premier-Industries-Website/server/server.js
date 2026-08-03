require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

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

// ---------- Email (Resend — HTTP API, avoids SMTP ports blocked on Render's free tier) ----------
const resend = new Resend(process.env.RESEND_API_KEY);

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

    const result = await resend.emails.send({
      from: 'Enquiry Bot <onboarding@resend.dev>', // swap to enquiries@yourdomain.com once your domain is verified in Resend
      to: process.env.NOTIFY_EMAIL,
      reply_to: email, // lets the owner hit "reply" and go straight to the customer
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

    if (result.error) {
      console.error('Email send failed (Resend API error):', JSON.stringify(result.error));
      return res.status(502).json({ error: 'Could not send your enquiry right now. Please try again.' });
    }

    console.log('Email sent successfully:', result.data && result.data.id);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
