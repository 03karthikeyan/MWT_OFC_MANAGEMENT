const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['todo', 'in_progress', 'review', 'completed'], 
    default: 'todo' 
  },
  dueDate: { type: Date },
  completedAt: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });

module.exports = mongoose.model('Task', taskSchema);
