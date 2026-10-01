const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  employeeId: { type: String, unique: true, sparse: true },
  jobRole: { type: String, default: 'Staff' },
  department: { type: String, default: 'IT' },
  dateOfJoining: { type: Date, default: Date.now },
  bankName: { type: String, default: '' },
  bankAccountNo: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  profilePicture: { type: String },
  contact: { type: String },
  payslip: { type: String }, // URL or path to payslip document
  canManageInternships: { type: Boolean, default: false },
  canManageEnquiries: { type: Boolean, default: false },
  canManageLeads: { type: Boolean, default: false },
  leaveBalance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 6 },
    earned: { type: Number, default: 15 },
  },
  status: { type: String, enum: ['joined', 'enquiry', 'rejected'], default: 'enquiry' },
  fcmToken: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
