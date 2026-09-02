const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  company: { type: String },
  email: { type: String, required: true },
  phone: { type: String },
  projectType: { type: String },
  budget: { type: String },
  status: { type: String, enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'], default: 'New' },
  notes: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
