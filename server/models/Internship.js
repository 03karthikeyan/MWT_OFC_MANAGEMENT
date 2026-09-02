const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  // === Applicant Info ===
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  college: { type: String, trim: true },
  year: { type: String, trim: true },

  // === Internship Details ===
  domain: { type: String, required: true, trim: true },
  duration: { type: String, required: true }, // in months or custom text
  startDate: { type: Date },
  endDate: { type: Date },

  // === Management ===
  leadManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who manages as lead
  fees: { type: Number, default: 0 }, // optional internship fees

  // === Status ===
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  about: {
    type: String,
    enum: ['joined', 'enquiry', 'rejected'],
    default: 'enquiry'
  },

  // === Documents Given ===
  documents: {
    certificate: { type: Boolean, default: false },
    offerLetter: { type: Boolean, default: false },
    completionLetter: { type: Boolean, default: false },
    bill: { type: Boolean, default: false },
  },

  // === Notes ===
  notes: { type: String, trim: true },

  // === Bill fields ===
  billNumber: { type: String },
  billDate: { type: Date },
  billAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  billDescription: { type: String, trim: true },
  billPaid: { type: String, enum: ['Unpaid', 'Paid', 'Partial', 'Failed'], default: 'Unpaid' },

}, { timestamps: true });

module.exports = mongoose.model('Internship', internshipSchema);
