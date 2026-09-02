const router = require('express').Router();
const OnDuty = require('../models/OnDuty');
const { auth, adminAuth } = require('../middleware/auth');
const Notification = require('../models/Notification');

const { sendNotification } = require('../services/pushNotification');

// Apply for on duty
router.post('/', auth, async (req, res) => {
  try {
    const { date, reason, expenses } = req.body;
    if (!date || !reason) {
      return res.status(400).json({ message: 'Date and reason are required' });
    }
    const onDuty = await OnDuty.create({
      userId: req.user._id,
      date,
      reason,
      expenses: {
        title: expenses?.title || '',
        price: expenses?.price || 0
      }
    });

    // Notify Admins
    sendNotification({
      targetRole: 'admin',
      title: '💼 New On Duty Request',
      message: `${req.user.name} applied for On Duty on ${new Date(date).toLocaleDateString()}`,
      data: { type: 'onduty', id: onDuty._id.toString() },
    });

    res.status(201).json({ message: 'On Duty applied successfully', onDuty });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get my on duty records
router.get('/my', auth, async (req, res) => {
  try {
    const onDutyRecords = await OnDuty.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({ onDutyRecords });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Admin: Get all on duty records
router.get('/all', adminAuth, async (req, res) => {
  try {
    let query = {};
    // Support date filtering to avoid fetching entire collection
    if (req.query.date) {
      const date = new Date(req.query.date);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      query.date = { $gte: startOfDay, $lt: endOfDay };
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    const onDutyRecords = await OnDuty.find(query)
      .populate('userId', 'name username email employeeId role jobRole profilePicture')
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 200)
      .lean();
    res.json({ onDutyRecords });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get pending on duty count
router.get('/pending-count', adminAuth, async (req, res) => {
  try {
    const count = await OnDuty.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update on duty status
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const onDuty = await OnDuty.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name username employeeId role jobRole profilePicture');
    
    if (!onDuty) {
      return res.status(404).json({ message: 'On Duty record not found' });
    }

    // Create a notification for the user in DB
    await Notification.create({
      title: `On Duty ${status.toUpperCase()}`,
      message: `Your on duty request for ${new Date(onDuty.date).toLocaleDateString()} has been ${status}.`,
      type: status === 'approved' ? 'info' : 'warning',
      target: 'specific',
      recipients: [onDuty.userId._id],
      sender: req.user._id
    });

    // Send real-time notification alert to employee
    sendNotification({
      recipientId: onDuty.userId._id,
      title: `💼 On Duty Request ${status.toUpperCase()}`,
      message: `Your on duty request for ${new Date(onDuty.date).toLocaleDateString()} has been ${status}.`,
      data: { type: 'onduty', status },
    });

    res.json({ message: `On Duty ${status}`, onDuty });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an on duty record
router.delete('/:id', auth, async (req, res) => {
  try {
    const onDuty = await OnDuty.findById(req.params.id);
    if (!onDuty) {
      return res.status(404).json({ message: 'On Duty record not found' });
    }

    // Allow if user is admin OR if user is the owner
    console.log('Delete Request Check:');
    console.log('User Role:', req.user.role);
    console.log('Record Owner ID:', onDuty.userId.toString());
    console.log('Requesting User ID:', req.user._id.toString());

    if (req.user.role === 'admin' || onDuty.userId.equals(req.user._id)) {
      await OnDuty.findByIdAndDelete(req.params.id);
      return res.json({ message: 'On Duty record deleted successfully' });
    }

    console.log('Deleting failed: Unauthorized - User is not admin and not owner');
    res.status(403).json({ message: 'Unauthorized: You do not own this record' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
