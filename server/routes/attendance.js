const router = require('express').Router();
const Attendance = require('../models/Attendance');
const { auth, adminAuth } = require('../middleware/auth');
const { getIO } = require('../socket');
const Holiday = require('../models/Holiday');
const { sendNotification } = require('../services/pushNotification');

// Get timezone-safe date window (handles UTC, IST, local server dates)
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

// Check In
router.post('/checkin', auth, async (req, res) => {
  try {
    const { canonicalDate, windowStart, windowEnd } = getDayRange();
    const { latitude, longitude, address } = req.body;
    
    let attendance = await Attendance.findOne({
      userId: req.user._id,
      $or: [
        { date: { $gte: windowStart, $lte: windowEnd } },
        { checkIn: { $gte: windowStart, $lte: windowEnd } }
      ]
    }).sort({ checkIn: -1 });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const checkInTime = new Date();
    const locationData = (latitude && longitude) ? { latitude, longitude, address: address || '' } : undefined;

    if (!attendance) {
      attendance = new Attendance({
        userId: req.user._id,
        date: canonicalDate,
        checkIn: checkInTime,
        location: locationData,
        status: 'present'
      });
    } else {
      attendance.checkIn = checkInTime;
      attendance.status = 'present';
      if (locationData) attendance.location = locationData;
    }

    await attendance.save();
    getIO().to(req.user._id.toString()).emit('attendance:update', attendance);

    // Send instant push & foreground notification alert
    sendNotification({
      recipientId: req.user._id,
      title: '⏰ Check-In Successful',
      message: `You checked in at ${checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Have a great day!`,
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
    const { windowStart, windowEnd } = getDayRange();
    
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      $or: [
        { date: { $gte: windowStart, $lte: windowEnd } },
        { checkIn: { $gte: windowStart, $lte: windowEnd } }
      ]
    }).sort({ checkIn: -1 });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'You need to check in first' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    const checkOutTime = new Date();
    attendance.checkOut = checkOutTime;

    // Calculate work hours
    const diffMs = checkOutTime - new Date(attendance.checkIn);
    const hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    attendance.workHours = hoursWorked;

    await attendance.save();
    getIO().to(req.user._id.toString()).emit('attendance:update', attendance);

    // Send instant push & foreground notification alert
    sendNotification({
      recipientId: req.user._id,
      title: '👋 Check-Out Successful',
      message: `You checked out at ${checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total: ${hoursWorked} hrs.`,
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
    const { windowStart, windowEnd } = getDayRange();
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      $or: [
        { date: { $gte: windowStart, $lte: windowEnd } },
        { checkIn: { $gte: windowStart, $lte: windowEnd } }
      ]
    }).sort({ checkIn: -1 });
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my attendance
router.get('/my', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    let query = { userId: req.user._id };

    if (req.query.month !== undefined && req.query.month !== '') {
      const targetMonth = parseInt(req.query.month);
      const targetYear = (req.query.year !== undefined && req.query.year !== '')
        ? parseInt(req.query.year)
        : new Date().getFullYear();
      const startDate = new Date(targetYear, targetMonth, 1);
      const totalDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const endDate = new Date(targetYear, targetMonth, totalDaysInMonth, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1, checkIn: -1 })
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
    if (req.query.date || req.query.today) {
      query = getDayFilter(req.query.date || null);
    }

    const rawAttendance = await Attendance.find(query)
      .populate('userId', 'name username email employeeId role jobRole profilePicture')
      .sort({ checkIn: -1, date: -1 })
      .lean();

    // Deduplicate by userId for target date so each employee has one consolidated daily record
    const userMap = new Map();
    rawAttendance.forEach((item) => {
      const uId = item.userId?._id ? item.userId._id.toString() : (item.userId ? item.userId.toString() : null);
      if (!uId) return;

      if (!userMap.has(uId)) {
        userMap.set(uId, item);
      } else {
        const existing = userMap.get(uId);
        if ((!existing.checkIn && item.checkIn) || (!existing.checkOut && item.checkOut) || (item.workHours > existing.workHours)) {
          userMap.set(uId, { ...existing, ...item });
        }
      }
    });

    const attendance = Array.from(userMap.values());
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin: Manual Checkout / Regularize Attendance Record
router.put('/manual-checkout/:id', adminAuth, async (req, res) => {
  try {
    const { checkOut, workHours, status, reason } = req.body;
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const checkOutDate = checkOut ? new Date(checkOut) : new Date();
    attendance.checkOut = checkOutDate;
    attendance.isManualCheckout = true;
    attendance.manualCheckoutReason = reason || 'Manual Admin Checkout';

    if (workHours !== undefined) {
      attendance.workHours = parseFloat(workHours);
    } else if (attendance.checkIn) {
      const diffMs = checkOutDate - new Date(attendance.checkIn);
      attendance.workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    } else {
      attendance.workHours = 8.0;
    }

    attendance.status = status || (attendance.workHours >= 6.0 ? 'present' : 'half-day');
    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('userId', 'name username employeeId jobRole profilePicture');

    getIO().to(attendance.userId.toString()).emit('attendance:update', populated);

    sendNotification({
      recipientId: attendance.userId,
      title: '📋 Attendance Regularized',
      message: `Your attendance for ${new Date(attendance.date).toLocaleDateString()} was regularized by Admin (${attendance.status.toUpperCase()}, ${attendance.workHours} hrs).`,
      data: { type: 'attendance' },
    });

    res.json({ message: 'Attendance regularized successfully', attendance: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin: Create or Regularize an Attendance record for an Employee on any date
router.post('/admin-regularize', adminAuth, async (req, res) => {
  try {
    const { userId, date, checkIn, checkOut, workHours, status, reason } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ message: 'User ID and Date are required' });
    }

    const { canonicalDate, windowStart, windowEnd } = getDayRange(date);

    let attendance = await Attendance.findOne({
      userId,
      $or: [
        { date: { $gte: windowStart, $lte: windowEnd } },
        { checkIn: { $gte: windowStart, $lte: windowEnd } }
      ]
    });

    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: canonicalDate,
      });
    }

    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    attendance.workHours = workHours !== undefined ? parseFloat(workHours) : 8.0;
    attendance.status = status || 'present';
    attendance.isManualCheckout = true;
    attendance.manualCheckoutReason = reason || 'Admin Regularization';

    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('userId', 'name username employeeId jobRole profilePicture');

    res.json({ message: 'Attendance created/regularized successfully', attendance: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/attendance/summary - Current authenticated employee's monthly attendance summary & statistics
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    const Leave = require('../models/Leave');
    const OnDuty = require('../models/OnDuty');
    const Holiday = require('../models/Holiday');

    const now = new Date();
    const targetMonth = (month !== undefined && month !== '') ? parseInt(month) : now.getMonth();
    const targetYear = (year !== undefined && year !== '') ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const totalDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const endDate = new Date(targetYear, targetMonth, totalDaysInMonth, 23, 59, 59);

    const [attendanceList, leaveList, onDutyList, holidayList] = await Promise.all([
      Attendance.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 }).lean(),

      Leave.find({
        userId,
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
      }).sort({ createdAt: -1 }).lean(),

      OnDuty.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 }).lean(),

      Holiday.find({
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 }).lean(),
    ]);

    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalWorkHours = 0;
    let onDutyApprovedDays = 0;

    const processedAttendance = attendanceList.map((att) => {
      const attDate = new Date(att.date);
      const isPastDay = attDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let effectiveStatus = att.status;
      let effectiveHours = att.workHours || 0;

      if (att.checkIn && !att.checkOut && !att.isManualCheckout && isPastDay) {
        effectiveStatus = 'half-day';
        effectiveHours = 4.0;
      }

      if (effectiveStatus === 'present') {
        presentDays += 1;
        totalWorkHours += (effectiveHours || 8.0);
      } else if (effectiveStatus === 'half-day') {
        halfDays += 1;
        presentDays += 0.5;
        totalWorkHours += (effectiveHours || 4.0);
      } else if (effectiveStatus === 'on-duty') {
        presentDays += 1;
        onDutyApprovedDays += 1;
        totalWorkHours += 8.0;
      }

      return {
        ...att,
        effectiveStatus,
        effectiveHours,
        isMissingCheckout: att.checkIn && !att.checkOut && !att.isManualCheckout && isPastDay,
      };
    });

    onDutyList.forEach((od) => {
      if (od.status === 'approved') {
        const odDate = new Date(od.date);
        const alreadyHasAtt = processedAttendance.some((a) => {
          const aDate = new Date(a.date);
          return aDate.getDate() === odDate.getDate() && aDate.getMonth() === odDate.getMonth();
        });
        if (!alreadyHasAtt) {
          presentDays += 1;
          onDutyApprovedDays += 1;
          totalWorkHours += 8.0;
        }
      }
    });

    const maxDaysToCount = (now.getFullYear() === targetYear && now.getMonth() === targetMonth)
      ? now.getDate()
      : totalDaysInMonth;

    let totalLeavesCount = 0;
    leaveList.filter(l => l.status === 'approved').forEach(l => {
      totalLeavesCount += (l.daysCount || 1.0);
    });

    absentDays = Math.max(0, maxDaysToCount - Math.ceil(presentDays) - Math.ceil(totalLeavesCount));

    res.json({
      month: targetMonth,
      year: targetYear,
      totalDaysInMonth,
      summary: {
        totalDaysInMonth,
        presentDays,
        halfDays,
        absentDays,
        totalWorkHours: parseFloat(totalWorkHours.toFixed(1)),
        onDutyApprovedDays,
        approvedLeavesCount: totalLeavesCount,
      },
      attendance: processedAttendance,
      leaves: leaveList,
      onDuty: onDutyList,
      holidays: holidayList,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Detailed Employee Attendance & Leaves Summary
router.get('/employee-summary/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const User = require('../models/User');
    const Leave = require('../models/Leave');
    const OnDuty = require('../models/OnDuty');

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const now = new Date();
    const targetMonth = (month !== undefined && month !== '') ? parseInt(month) : now.getMonth();
    const targetYear = (year !== undefined && year !== '') ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const totalDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const endDate = new Date(targetYear, targetMonth, totalDaysInMonth, 23, 59, 59);

    const [attendanceList, leaveList, onDutyList] = await Promise.all([
      Attendance.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 }).lean(),

      Leave.find({
        userId,
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
      }).sort({ createdAt: -1 }).lean(),

      OnDuty.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 }).lean(),
    ]);

    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalWorkHours = 0;
    let onDutyApprovedDays = 0;

    const processedAttendance = attendanceList.map((att) => {
      const attDate = new Date(att.date);
      const isPastDay = attDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let effectiveStatus = att.status;
      let effectiveHours = att.workHours || 0;

      if (att.checkIn && !att.checkOut && !att.isManualCheckout && isPastDay) {
        effectiveStatus = 'half-day';
        effectiveHours = 4.0;
      }

      if (effectiveStatus === 'present') {
        presentDays += 1;
        totalWorkHours += (effectiveHours || 8.0);
      } else if (effectiveStatus === 'half-day') {
        halfDays += 1;
        presentDays += 0.5;
        totalWorkHours += (effectiveHours || 4.0);
      } else if (effectiveStatus === 'on-duty') {
        presentDays += 1;
        onDutyApprovedDays += 1;
        totalWorkHours += 8.0;
      }

      return {
        ...att,
        effectiveStatus,
        effectiveHours,
        isMissingCheckout: att.checkIn && !att.checkOut && !att.isManualCheckout && isPastDay,
      };
    });

    onDutyList.forEach((od) => {
      if (od.status === 'approved') {
        const odDate = new Date(od.date);
        const alreadyHasAtt = processedAttendance.some((a) => {
          const aDate = new Date(a.date);
          return aDate.getDate() === odDate.getDate() && aDate.getMonth() === odDate.getMonth();
        });
        if (!alreadyHasAtt) {
          presentDays += 1;
          onDutyApprovedDays += 1;
          totalWorkHours += 8.0;
        }
      }
    });

    const maxDaysToCount = (now.getFullYear() === targetYear && now.getMonth() === targetMonth)
      ? now.getDate()
      : totalDaysInMonth;

    let totalLeavesCount = 0;
    leaveList.filter(l => l.status === 'approved').forEach(l => {
      totalLeavesCount += (l.daysCount || 1.0);
    });

    absentDays = Math.max(0, maxDaysToCount - Math.ceil(presentDays) - Math.ceil(totalLeavesCount));

    res.json({
      employee: user,
      month: targetMonth,
      year: targetYear,
      totalDaysInMonth,
      summary: {
        totalDaysInMonth,
        presentDays,
        halfDays,
        absentDays,
        totalWorkHours: parseFloat(totalWorkHours.toFixed(1)),
        onDutyApprovedDays,
        approvedLeavesCount: totalLeavesCount,
      },
      attendance: processedAttendance,
      leaves: leaveList,
      onDuty: onDutyList,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
