const router = require('express').Router();
const Holiday = require('../models/Holiday');
const { auth, adminAuth } = require('../middleware/auth');

// Get all holidays
router.get('/', auth, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ holidays });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add holiday (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date || !reason) {
      return res.status(400).json({ message: 'Date and reason are required' });
    }

    const d = new Date(date);
    const normalizedDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const existing = await Holiday.findOne({ date: normalizedDate });
    if (existing) {
      return res.status(400).json({ message: 'A holiday already exists on this date' });
    }

    const holiday = await Holiday.create({ date: normalizedDate, reason });
    res.status(201).json({ message: 'Holiday added successfully', holiday });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete holiday (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: 'Holiday deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
