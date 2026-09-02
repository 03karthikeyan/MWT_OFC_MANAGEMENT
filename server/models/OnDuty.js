const mongoose = require('mongoose');

const onDutySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  expenses: {
    title: { type: String, trim: true },
    price: { type: Number, default: 0 }
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
}, { timestamps: true });

onDutySchema.index({ userId: 1, date: -1 });
onDutySchema.index({ status: 1 });
onDutySchema.index({ date: -1, status: 1 });

module.exports = mongoose.model('OnDuty', onDutySchema);
