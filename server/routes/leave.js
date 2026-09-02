const router = require('express').Router();
const Leave = require('../models/Leave');
const { auth, adminAuth } = require('../middleware/auth');
const Notification = require('../models/Notification');

const { sendNotification } = require('../services/pushNotification');

// Apply for leave
router.post('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const leave = await Leave.create({
      userId: req.user._id,
      startDate,
      endDate,
      reason,
    });

    // Notify Admin of new leave application
    sendNotification({
      targetRole: 'admin',
      title: 'New Leave Request',
      message: `${req.user.name} requested leave (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()})`,
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
      .populate('userId', 'name username email employeeId role jobRole profilePicture')
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
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    ).populate('userId', 'name username employeeId role jobRole profilePicture');
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Create a specific notification for the user
    await Notification.create({
      title: `Leave ${status.toUpperCase()}`,
      message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${status}.`,
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
    res.status(500).json({ message: 'Server error' });
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
