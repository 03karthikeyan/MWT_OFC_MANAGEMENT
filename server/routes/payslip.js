const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payslip = require('../models/Payslip');
const { auth, adminAuth } = require('../middleware/auth');
const { sendNotification } = require('../services/pushNotification');

// Admin only: Generate a payslip for a user
router.post('/generate/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { month, earnings, deductions, grossPay, totalDeductions, netSalary, daysPayable, hrSignatory } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const payslip = new Payslip({
      userId: req.params.userId,
      month,
      daysPayable,
      earnings,
      deductions,
      summary: {
        grossPay,
        totalDeductions,
        netSalary
      },
      commencementDate: req.body.commencementDate,
      hrSignatory
    });

    await payslip.save();

    sendNotification({
      recipientId: req.params.userId,
      title: '💵 Payslip Released',
      message: `Your payslip for ${month} is now available for download.`,
      data: { type: 'payslips', month, screen: 'payslips' },
    });

    res.status(201).json({ message: 'Payslip generated successfully', payslip });
  } catch (err) {
    res.status(500).json({ message: 'Error generating payslip', error: err.message });
  }
});

// Admin only: Delete a payslip
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const payslip = await Payslip.findByIdAndDelete(req.params.id);
    if (!payslip) return res.status(404).json({ message: 'Payslip not found' });
    res.json({ message: 'Payslip deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting payslip', error: err.message });
  }
});

// Admin only: Get all payslips for a user
router.get('/user-history/:userId', auth, adminAuth, async (req, res) => {
  try {
    const payslips = await Payslip.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history', error: err.message });
  }
});

// User only: Get my own payslips
router.get('/my-payslips', auth, async (req, res) => {
  try {
    const payslips = await Payslip.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching payslips', error: err.message });
  }
});

module.exports = router;
