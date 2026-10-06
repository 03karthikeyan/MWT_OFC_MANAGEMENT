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

// Helper: Get timezone-safe date window (handles UTC, IST, local server dates)
const getDayRange = (dateInput) => {
  let y, m, d;
  if (!dateInput) {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth();
    d = now.getDate();
  } else if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('T')[0].split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else {
    const dt = new Date(dateInput);
    y = dt.getFullYear();
    m = dt.getMonth();
    d = dt.getDate();
  }

  const startUtc = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const endUtc = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
  const startLocal = new Date(y, m, d, 0, 0, 0, 0);
  const endLocal = new Date(y, m, d, 23, 59, 59, 999);

  const windowStart = new Date(Math.min(startUtc.getTime(), startLocal.getTime()) - 12 * 3600 * 1000);
  const windowEnd = new Date(Math.max(endUtc.getTime(), endLocal.getTime()) + 12 * 3600 * 1000);

  return {
    windowStart,
    windowEnd,
    canonicalDate: startUtc,
    y, m, d
  };
};

const getDayFilter = (dateInput, extra = {}) => {
  const { windowStart, windowEnd } = getDayRange(dateInput);
  return {
    ...extra,
    $or: [
      { date: { $gte: windowStart, $lte: windowEnd } },
      { checkIn: { $gte: windowStart, $lte: windowEnd } },
      { createdAt: { $gte: windowStart, $lte: windowEnd } },
    ]
  };
};

// Fast stats only route
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const dayFilter = getDayFilter();
    const [userCount, attendanceRecords, onDutyCount, internshipStats] = await Promise.all([
      User.countDocuments(),
      Attendance.find(dayFilter).select('userId checkIn').lean(),
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

    const uniquePresentUsers = new Set(
      attendanceRecords
        .map((a) => (a.userId ? a.userId.toString() : null))
        .filter(Boolean)
    );

    res.json({
      totalUsers: userCount,
      presentToday: uniquePresentUsers.size,
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
    const dayFilter = getDayFilter();
    const now = new Date();

    const [
      rawAttendance,
      recentWork,
      recentLeaves,
      notifications,
      recentRequests
    ] = await Promise.all([
      Attendance.find(dayFilter)
        .populate('userId', 'name jobRole profilePicture employeeId role')
        .sort({ checkIn: -1, date: -1 })
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

    // Deduplicate attendance by userId
    const userMap = new Map();
    rawAttendance.forEach((item) => {
      const uId = item.userId?._id ? item.userId._id.toString() : null;
      if (uId && !userMap.has(uId)) {
        userMap.set(uId, item);
      }
    });

    const allAttendance = Array.from(userMap.values());

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
