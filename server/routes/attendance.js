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
    const { latitude, longitude, address } = req.body;
    
    let attendance = await Attendance.findOne({ userId: req.user._id, date: today });
    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const checkInTime = new Date();
    const locationData = (latitude && longitude) ? { latitude, longitude, address: address || '' } : undefined;

    if (!attendance) {
      attendance = new Attendance({
        userId: req.user._id,
        date: today,
        checkIn: checkInTime,
        location: locationData,
      });
    } else {
      attendance.checkIn = checkInTime;
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
    const today = getToday();
    
    const attendance = await Attendance.findOne({ userId: req.user._id, date: today });
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
      .sort({ date: -1 })
      .limit(limit);
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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

    const targetDate = new Date(date);
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    let attendance = await Attendance.findOne({ userId, date: dayStart });
    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: dayStart,
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

    // Process attendance with Half-Day rule for un-checked-out past records
    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalWorkHours = 0;
    let onDutyApprovedDays = 0;

    const processedAttendance = attendanceList.map((att) => {
      const attDate = new Date(att.date);
      const isPastDay = attDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // If checked in but NO check out and not manually regularized, treat as Half-Day
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

    // Check approved OnDuty records that count as Present
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

// Detailed Employee Attendance & Leaves Summary (for Employee Details screen in Admin Directory)
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

    // Process attendance with Half-Day rule for un-checked-out past records
    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalWorkHours = 0;
    let onDutyApprovedDays = 0;

    const processedAttendance = attendanceList.map((att) => {
      const attDate = new Date(att.date);
      const isPastDay = attDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // If checked in but NO check out and not manually regularized, treat as Half-Day
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

    // Check approved OnDuty records that count as Present
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

    // Calculate absent days up to today
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

