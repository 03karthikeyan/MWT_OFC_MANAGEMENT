
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'urgent'], default: 'info' },
  target: { type: String, enum: ['all', 'specific'], default: 'all' },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // Optional: hide after a certain date
}, { timestamps: true });

notificationSchema.index({ target: 1, startsAt: -1 });
notificationSchema.index({ recipients: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
