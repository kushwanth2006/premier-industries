const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  company:   { type: String, trim: true },
  email:     { type: String, required: true, trim: true, lowercase: true },
  phone:     { type: String, trim: true },
  component: { type: String, trim: true },
  message:   { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enquiry', enquirySchema);
