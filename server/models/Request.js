const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Specific user or null for admins generally
  type: {
    type: String,
    enum: ['Request', 'Review', 'Feedback', 'Other'],
    default: 'Request'
  },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  websiteLink: { type: String, trim: true },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  remarks: { type: String, default: '' }, // For admin or recipient notes
}, { timestamps: true });

requestSchema.index({ userId: 1, createdAt: -1 });
requestSchema.index({ recipientId: 1, status: 1 });
requestSchema.index({ status: 1 });

module.exports = mongoose.model('Request', requestSchema);
