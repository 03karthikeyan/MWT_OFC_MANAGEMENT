const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Payslip = require('../models/Payslip');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    
    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Name, username, and password are required' });
    }

    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      role: 'user',
      employeeId: `EMP-${Date.now().toString().slice(-6)}`,
    });

    res.status(201).json({
      message: 'Registration successful',
      user: { _id: user._id, name: user.name, email: user.email, username: user.username, role: user.role, employeeId: user.employeeId },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, username, password } = req.body;
    const loginId = identifier || username;
    
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required' });
    }

    const trimmedIdentifier = loginId.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { username: trimmedIdentifier },
        { email: trimmedIdentifier }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'workpulse_secret_key_2024_office_management',
      { expiresIn: '7d' }
    );

    // Automatically mark attendance as present on login
    try {
      const Attendance = require('../models/Attendance');
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const existingAttendance = await Attendance.findOne({ userId: user._id, date: today });
      if (!existingAttendance) {
        await Attendance.create({
          userId: user._id,
          date: today,
          checkIn: now,
          status: 'present'
        });
      }
    } catch (attendanceErr) {
      console.error('Failed to mark attendance on login:', attendanceErr);
    }

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, username: user.username, role: user.role, profilePicture: user.profilePicture, employeeId: user.employeeId, jobRole: user.jobRole, bankName: user.bankName, bankAccountNo: user.bankAccountNo, ifscCode: user.ifscCode },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user payslips
router.get('/mypayslips', auth, async (req, res) => {
  try {
    const payslips = await Payslip.find({ userId: req.user._id }).sort({ year: -1, createdAt: -1 });
    res.json({ payslips });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update own profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword, profilePicture, contact, bankName, bankAccountNo, ifscCode } = req.body;
    
    // Preparation for update data
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (contact !== undefined) updateData.contact = contact.trim();
    if (bankName !== undefined) updateData.bankName = bankName.trim();
    if (bankAccountNo !== undefined) updateData.bankAccountNo = bankAccountNo.trim();
    if (ifscCode !== undefined) updateData.ifscCode = ifscCode.trim();

    // Password logic remains if newPassword is provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      
      const userToUpdate = await User.findById(req.user._id);
      if (!userToUpdate) return res.status(404).json({ message: 'User not found' });
      
      const isMatch = await bcrypt.compare(currentPassword, userToUpdate.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      if (newPassword.length < 4) {
        return res.status(400).json({ message: 'Password too short' });
      }
      
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Profile Update Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
