const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['Travel', 'Food & Meals', 'Office Supplies', 'Client Meeting', 'Internet/Phone', 'Hardware/Equipment', 'Other'],
    default: 'Other'
  },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '', trim: true },
  receiptUrl: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'reimbursed'], 
    default: 'pending' 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String, default: '' },
  reimbursedAt: { type: Date },
}, { timestamps: true });

expenseSchema.index({ userId: 1, status: 1 });
expenseSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
