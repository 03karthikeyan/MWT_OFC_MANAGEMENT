const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Payslip = require('../models/Payslip');
const { auth, adminAuth, internshipAuth } = require('../middleware/auth');

// Update FCM Push Token
router.post('/fcm-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    await User.findByIdAndUpdate(req.user._id, { fcmToken: token });
    console.log(`📱 FCM token updated for user ${req.user._id}`);
    res.json({ message: 'FCM token saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add user (admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, email, username, password, role, employeeId, jobRole, contact, bankName, bankAccountNo, ifscCode } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Name, username, and password are required' });
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    if (employeeId) {
      const existingId = await User.findOne({ employeeId });
      if (existingId) return res.status(400).json({ message: 'Employee ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      role: role || 'user',
      employeeId: employeeId || `EMP-${Date.now().toString().slice(-6)}`,
      jobRole: jobRole || 'Staff',
      department: req.body.department || 'IT',
      dateOfJoining: req.body.dateOfJoining || Date.now(),
      contact: contact || '',
      bankName: bankName || '',
      bankAccountNo: bankAccountNo || '',
      ifscCode: ifscCode || '',
      canManageInternships: req.body.canManageInternships || false,
      canManageEnquiries: req.body.canManageEnquiries || false,
      canManageLeads: req.body.canManageLeads || false,
      status: req.body.status || 'enquiry',
    });

    res.status(201).json({
      message: 'User added successfully',
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        username: user.username, 
        role: user.role, 
        employeeId: user.employeeId, 
        jobRole: user.jobRole,
        bankName: user.bankName,
        bankAccountNo: user.bankAccountNo,
        ifscCode: user.ifscCode,
        canManageInternships: user.canManageInternships
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user (admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, email, role, employeeId, payslip, jobRole, password, contact, bankName, bankAccountNo, ifscCode } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (employeeId) updateData.employeeId = employeeId;
    if (jobRole) updateData.jobRole = jobRole;
    if (contact !== undefined) updateData.contact = contact;
    if (payslip !== undefined) updateData.payslip = payslip;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankAccountNo !== undefined) updateData.bankAccountNo = bankAccountNo;
    if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
    if (req.body.canManageInternships !== undefined) updateData.canManageInternships = req.body.canManageInternships;
    if (req.body.canManageEnquiries !== undefined) updateData.canManageEnquiries = req.body.canManageEnquiries;
    if (req.body.canManageLeads !== undefined) updateData.canManageLeads = req.body.canManageLeads;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.department !== undefined) updateData.department = req.body.department;
    if (req.body.dateOfJoining !== undefined) updateData.dateOfJoining = req.body.dateOfJoining;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete user (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team member list (for all users)
router.get('/team', auth, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ name: 1 });

    const attendance = await Attendance.find({ date: today });

    const team = users.map(user => {
      const att = attendance.find(a => a.userId.toString() === user._id.toString());
      return {
        ...user.toObject(),
        isActive: !!(att && att.checkIn && !att.checkOut)
      };
    });

    res.json({ team });
  } catch (err) {
    console.error('Error fetching team:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lead managers list (admin/internship manager)
router.get('/leads', internshipAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('name jobRole email role')
      .sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Payslip management has been moved to routes/payslip.js

module.exports = router;
