const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  clientName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Planned', 'In Progress', 'On Hold', 'Completed'], 
    default: 'In Progress' 
  },
  deadline: { type: Date },
  teamMembers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String }
  }],
  progress: { type: Number, default: 0, min: 0, max: 100 },
  budget: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
