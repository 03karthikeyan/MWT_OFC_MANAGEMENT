const router = require('express').Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const WorkUpdate = require('../models/WorkUpdate');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const Request = require('../models/Request');
const OnDuty = require('../models/OnDuty');
const Internship = require('../models/Internship');

// Helper: get start of today
const getToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// NEW: Ultra-fast stats only route for instant page load
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const today = getToday();
    const [userCount, attendanceCount, onDutyCount, internshipStats] = await Promise.all([
      User.countDocuments(),
      Attendance.countDocuments({ date: today }),
      OnDuty.countDocuments({ status: 'pending' }),
      (async () => {
        try {
          const stats = await Internship.aggregate([
            {
              $group: {
                _id: null,
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                totalInvoiced: { $sum: '$invoiceAmount' },
                totalCollected: { $sum: '$collectedAmount' }
              }
            }
          ]);
          return stats[0] || { active: 0, totalInvoiced: 0, totalCollected: 0 };
        } catch { return { active: 0, totalInvoiced: 0, totalCollected: 0 }; }
      })()
    ]);

    res.json({
        totalUsers: userCount,
        presentToday: attendanceCount,
        pendingOnDuty: onDutyCount,
        activeInterns: internshipStats.active,
        totalInvoiced: internshipStats.totalInvoiced,
        totalCollected: internshipStats.totalCollected
    });
  } catch (err) {
    res.status(500).json({ message: 'Stats error' });
  }
});

// Optimized list data route
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const today = getToday();
    const now = new Date();

    const [
      allAttendance,
      recentWork,
      recentLeaves,
      notifications,
      recentRequests
    ] = await Promise.all([
      Attendance.find({ date: today })
        .populate('userId', 'name jobRole profilePicture employeeId')
        .sort({ checkIn: -1 })
        .limit(15)
        .lean(),
      
      WorkUpdate.find()
        .populate('userId', 'name jobRole profilePicture employeeId')
        .populate('projectId', 'name')
        .sort({ date: -1 })
        .limit(8)
        .lean(),
      
      Leave.find()
        .populate('userId', 'name jobRole profilePicture employeeId')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      Notification.find({
        $and: [
          { $or: [{ target: 'all' }, { recipients: req.user._id }] },
          { startsAt: { $lte: now } },
          { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }] }
        ]
      }).sort({ createdAt: -1 }).limit(5).lean(),
      
      (() => {
        const query = req.user.role === 'admin'
          ? { $or: [{ recipientId: req.user._id }, { recipientId: null }] }
          : { recipientId: req.user._id };
        return Request.find(query)
          .populate('userId', 'name jobRole profilePicture employeeId')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
      })()
    ]);

    res.json({
      allAttendance,
      allWork: recentWork,
      allLeaves: recentLeaves,
      notifications,
      incomingRequests: recentRequests
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
