const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workHours: { type: Number, default: 0 },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, default: '' },
  },
  checkInLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, default: '' },
  },
  checkOutLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, default: '' },
  },
  isOnDuty: { type: Boolean, default: false },
  isManualCheckout: { type: Boolean, default: false },
  manualCheckoutReason: { type: String, default: '' },
  status: { type: String, enum: ['present', 'absent', 'half-day', 'on-duty'], default: 'present' },
}, { timestamps: true });

// Compound index: one record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
