const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  leaveType: {
    type: String,
    enum: ['casual', 'sick', 'earned', 'unpaid'],
    default: 'casual',
  },
  session: {
    type: String,
    enum: ['full_day', 'first_half', 'second_half'],
    default: 'full_day',
  },
  daysCount: { type: Number, default: 1 },
  reason: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

leaveSchema.index({ userId: 1, status: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
