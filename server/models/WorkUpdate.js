const mongoose = require('mongoose');

const workUpdateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'blocked'], 
    default: 'pending' 
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

workUpdateSchema.index({ userId: 1, date: -1 });
workUpdateSchema.index({ date: -1 });

module.exports = mongoose.model('WorkUpdate', workUpdateSchema);
