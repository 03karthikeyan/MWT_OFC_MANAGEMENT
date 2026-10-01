const router = require('express').Router();
const Leave = require('../models/Leave');
const { auth, adminAuth } = require('../middleware/auth');
const Notification = require('../models/Notification');

const { sendNotification } = require('../services/pushNotification');

// Get leave balances for current user or specific user
router.get('/balances', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('leaveBalance name employeeId');
    const defaultBalance = { casual: 12, sick: 6, earned: 15 };
    const balance = user?.leaveBalance || defaultBalance;
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/balances/:userId', adminAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId).select('leaveBalance name employeeId');
    const defaultBalance = { casual: 12, sick: 6, earned: 15 };
    const balance = user?.leaveBalance || defaultBalance;
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Apply for leave
router.post('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, reason, leaveType, session } = req.body;
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const type = leaveType || 'casual';
    const sess = session || 'full_day';

    let count = 1.0;
    if (sess === 'first_half' || sess === 'second_half') {
      count = 0.5;
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      count = diffDays > 0 ? diffDays : 1.0;
    }

    const leave = await Leave.create({
      userId: req.user._id,
      startDate,
      endDate,
      reason,
      leaveType: type,
      session: sess,
      daysCount: count,
    });

    // Notify Admin of new leave application
    sendNotification({
      targetRole: 'admin',
      title: 'New Leave Request',
      message: `${req.user.name} requested ${type.toUpperCase()} leave (${count} day(s))`,
      data: { type: 'leave', leaveId: leave._id.toString() },
    });

    res.status(201).json({ message: 'Leave applied successfully', leave });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get my leaves
router.get('/my', auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all leaves
router.get('/all', adminAuth, async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('userId', 'name username email employeeId role jobRole profilePicture leaveBalance')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update leave status
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const existingLeave = await Leave.findById(req.params.id);
    if (!existingLeave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    existingLeave.status = status;
    if (rejectionReason) existingLeave.rejectionReason = rejectionReason;
    await existingLeave.save();

    // Auto-deduct from quota on approval if not unpaid
    if (status === 'approved' && existingLeave.leaveType !== 'unpaid') {
      const User = require('../models/User');
      const user = await User.findById(existingLeave.userId);
      if (user) {
        if (!user.leaveBalance) {
          user.leaveBalance = { casual: 12, sick: 6, earned: 15 };
        }
        const currentBal = user.leaveBalance[existingLeave.leaveType] || 0;
        user.leaveBalance[existingLeave.leaveType] = Math.max(0, currentBal - (existingLeave.daysCount || 1));
        await user.save();
      }
    }

    const leave = await Leave.findById(req.params.id)
      .populate('userId', 'name username employeeId role jobRole profilePicture leaveBalance');

    // Create a specific notification for the user
    await Notification.create({
      title: `Leave ${status.toUpperCase()}`,
      message: `Your ${leave.leaveType || ''} leave request (${leave.daysCount || 1} day(s)) has been ${status}.`,
      type: status === 'approved' ? 'info' : 'warning',
      target: 'specific',
      recipients: [leave.userId._id],
      sender: req.user._id
    });

    // Send real-time notification to employee
    sendNotification({
      recipientId: leave.userId._id,
      title: `Leave Request ${status.toUpperCase()}`,
      message: `Your leave request has been ${status}.`,
      data: { type: 'leave_status', status },
    });

    res.json({ message: `Leave ${status}`, leave });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin: Get pending leaves count
router.get('/pending-count', adminAuth, async (req, res) => {
  try {
    const count = await Leave.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete a leave request
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    res.json({ message: 'Leave deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
