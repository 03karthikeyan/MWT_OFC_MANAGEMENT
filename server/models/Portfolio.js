const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  clientName: { type: String },
  category: { 
    type: String, 
    enum: ['Web Development', 'Mobile App', 'Logo Design', 'Branding', 'Photography', 'UI/UX Design'], 
    default: 'Web Development' 
  },
  thumbnail: { type: String }, // Image URL or path
  liveLink: { type: String },
  completionDate: { type: Date },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
