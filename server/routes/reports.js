const router = require('express').Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Expense = require('../models/Expense');
const Task = require('../models/Task');
const Payslip = require('../models/Payslip');

// GET /api/reports/muster-roll — Generate comprehensive Monthly Attendance Muster Roll
router.get('/muster-roll', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month !== undefined ? parseInt(req.query.month) : now.getMonth();
    const year = req.query.year !== undefined ? parseInt(req.query.year) : now.getFullYear();

    const startDate = new Date(year, month, 1);
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const endDate = new Date(year, month, totalDaysInMonth, 23, 59, 59);

    const [users, attendanceRecords, leaveRecords] = await Promise.all([
      User.find({ role: 'user' }).select('name employeeId jobRole department').sort({ name: 1 }).lean(),
      Attendance.find({ date: { $gte: startDate, $lte: endDate } }).lean(),
      Leave.find({
        status: 'approved',
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
      }).lean(),
    ]);

    // Build user-by-user matrix
    const reportData = users.map((user) => {
      const userAttendance = attendanceRecords.filter((a) => a.userId.toString() === user._id.toString());
      const userLeaves = leaveRecords.filter((l) => l.userId.toString() === user._id.toString());

      let presentDays = 0;
      let totalWorkHours = 0;
      let halfDays = 0;
      const dailyMatrix = {};

      for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Check attendance record
        const att = userAttendance.find((a) => {
          const aDate = new Date(a.date);
          return aDate.getFullYear() === year && aDate.getMonth() === month && aDate.getDate() === day;
        });

        // Check approved leave
        const onLeave = userLeaves.find((l) => {
          const lStart = new Date(l.startDate);
          const lEnd = new Date(l.endDate);
          return currentDate >= new Date(lStart.setHours(0,0,0,0)) && currentDate <= new Date(lEnd.setHours(23,59,59,999));
        });

        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

        if (att && att.checkIn) {
          if (att.status === 'half-day') {
            dailyMatrix[dateKey] = 'HD';
            halfDays += 1;
            presentDays += 0.5;
          } else {
            dailyMatrix[dateKey] = 'P';
            presentDays += 1;
          }
          totalWorkHours += (att.workHours || 8);
        } else if (onLeave) {
          dailyMatrix[dateKey] = onLeave.session === 'full_day' ? 'L' : 'HD-L';
        } else if (isWeekend) {
          dailyMatrix[dateKey] = 'WO'; // Weekly Off
        } else if (currentDate <= now) {
          dailyMatrix[dateKey] = 'A'; // Absent
        } else {
          dailyMatrix[dateKey] = '-'; // Future date
        }
      }

      return {
        userId: user._id,
        name: user.name,
        employeeId: user.employeeId || 'N/A',
        jobRole: user.jobRole || 'Staff',
        department: user.department || 'General',
        totalDaysInMonth,
        presentDays,
        halfDays,
        totalWorkHours: parseFloat(totalWorkHours.toFixed(1)),
        dailyMatrix,
      };
    });

    res.json({
      month,
      year,
      totalDaysInMonth,
      totalEmployees: users.length,
      report: reportData,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reports/summary-overview — High level HR analytics metrics
router.get('/summary-overview', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalEmployees,
      presentToday,
      pendingLeaves,
      pendingExpenses,
      activeTasks,
      totalExpensesThisMonth
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Attendance.countDocuments({ date: startOfToday }),
      Leave.countDocuments({ status: 'pending' }),
      Expense.countDocuments({ status: 'pending' }),
      Task.countDocuments({ status: { $in: ['todo', 'in_progress'] } }),
      Expense.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $in: ['approved', 'reimbursed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
    ]);

    res.json({
      totalEmployees,
      presentToday,
      absentToday: Math.max(0, totalEmployees - presentToday),
      pendingLeaves,
      pendingExpenses,
      activeTasks,
      totalReimbursementMonth: totalExpensesThisMonth[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
