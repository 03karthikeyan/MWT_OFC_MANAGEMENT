const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // e.g. "January 2026"
  daysPayable: { type: Number, default: 30 },
  earnings: {
    basicSalary: { type: Number, default: 0 },
    houseRentAllowance: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    leaveTravelAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 }
  },
  deductions: {
    tds: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    pfEmployerContribution: { type: Number, default: 0 },
    esicEmployerContribution: { type: Number, default: 0 },
    salaryDeduction: { type: Number, default: 0 }
  },
  summary: {
    grossPay: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 }
  },
  commencementDate: { type: Date },
  hrSignatory: { type: String, default: 'Gopinath P' },
  generatedDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payslip', payslipSchema);
