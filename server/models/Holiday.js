const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  reason: { type: String, required: true },
  type: { type: String, enum: ['holiday', 'event'], default: 'holiday' }
}, { timestamps: true });

module.exports = mongoose.models.Holiday || mongoose.model('Holiday', holidaySchema);
