const router = require('express').Router();
const Attendance = require('../models/Attendance');
const { auth, adminAuth } = require('../middleware/auth');
const { getIO } = require('../socket');
const Holiday = require('../models/Holiday');

const { sendNotification } = require('../services/pushNotification');

// Get today's date (start of day)
const getToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Check In
router.post('/checkin', auth, async (req, res) => {
  try {
    const today = getToday();
    
    let attendance = await Attendance.findOne({ userId: req.user._id, date: today });
    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new Attendance({
        userId: req.user._id,
        date: today,
        checkIn: new Date(),
      });
    } else {
      attendance.checkIn = new Date();
    }

    await attendance.save();
    getIO().to(req.user._id.toString()).emit('attendance:update', attendance);

    // Send instant push & foreground notification alert
    sendNotification({
      recipientId: req.user._id,
      title: '⏰ Check-In Successful',
      message: `You checked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Have a great day!`,
      data: { type: 'attendance' },
    });

    res.json({ message: 'Checked in successfully', attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Check Out
router.post('/checkout', auth, async (req, res) => {
  try {
    const today = getToday();
    
    const attendance = await Attendance.findOne({ userId: req.user._id, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'You need to check in first' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    await attendance.save();
    getIO().to(req.user._id.toString()).emit('attendance:update', attendance);

    // Send instant push & foreground notification alert
    sendNotification({
      recipientId: req.user._id,
      title: '👋 Check-Out Successful',
      message: `You checked out at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Have a relaxing evening!`,
      data: { type: 'attendance' },
    });

    res.json({ message: 'Checked out successfully', attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remind all users to Check-in
router.post('/remind-checkin', adminAuth, async (req, res) => {
  try {
    sendNotification({
      title: '⏰ Daily Attendance Reminder',
      message: 'Don\'t forget to punch your daily attendance check-in on the HRMS app.',
      data: { type: 'attendance' },
    });
    res.json({ message: 'Attendance check-in reminder sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remind all users to Check-out
router.post('/remind-checkout', adminAuth, async (req, res) => {
  try {
    sendNotification({
      title: '👋 Daily Attendance Reminder',
      message: 'Workday is wrapping up! Remember to punch your check-out on the HRMS app.',
      data: { type: 'attendance' },
    });
    res.json({ message: 'Attendance check-out reminder sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get today's attendance
router.get('/today', auth, async (req, res) => {
  try {
    const today = getToday();
    const attendance = await Attendance.findOne({ userId: req.user._id, date: today });
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my attendance
router.get('/my', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const attendance = await Attendance.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(limit);
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all attendance
router.get('/all', adminAuth, async (req, res) => {
  try {
    let query = {};
    if (req.query.date) {
      const date = new Date(req.query.date);
      query.date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } else if (req.query.today) {
      query.date = getToday();
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name username email employeeId role jobRole profilePicture')
      .sort({ date: -1, checkIn: -1 })
      .lean();
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get summary for calendar
router.get('/summary', auth, async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const targetUserId = req.user.role === 'admin' ? userId : req.user._id;

    if (req.user.role !== 'admin' && userId && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const now = new Date();
    const targetMonth = (month !== undefined && month !== '') ? parseInt(month) : now.getMonth();
    const targetYear = (year !== undefined && year !== '') ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const matchQuery = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (targetUserId) {
      matchQuery.userId = targetUserId;
    }

    const attendance = await Attendance.find(matchQuery).populate('userId', 'name').lean();

    // Also get leaves for this period
    const Leave = require('../models/Leave');
    const leaveQuery = {
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ]
    };

    if (targetUserId) {
      leaveQuery.userId = targetUserId;
    }

    const leaves = await Leave.find(leaveQuery).populate('userId', 'name').lean();
    
    // Fetch holidays for this period
    const holidays = await Holiday.find({
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    const User = require('../models/User');
    const members = await User.find({ role: 'user' }, 'name').lean();

    res.json({ attendance, leaves, members, holidays });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
