const express = require('express');
const router = express.Router();
const Internship = require('../models/Internship');
const { auth, adminAuth, internshipAuth } = require('../middleware/auth');

// ── Public / User: Submit enquiry ──────────────────────────────────────────
router.post('/enquiry', async (req, res) => {
  try {
    const internship = new Internship(req.body);
    await internship.save();
    res.status(201).json({ message: 'Enquiry submitted successfully', data: internship });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit enquiry', error: err.message });
  }
});

// ── Get all internships (admin/manager) ───────────────────────────────────
router.get('/', internshipAuth, async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate('leadManager', 'name jobRole email')
      .sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats/summary', internshipAuth, async (req, res) => {
  try {
    const stats = await Internship.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          totalInvoiced: { $sum: { $ifNull: ["$billAmount", 0] } },
          totalCollected: { $sum: { $ifNull: ["$paidAmount", 0] } }
        }
      }
    ]);
    const summary = stats[0] || { total: 0, pending: 0, active: 0, completed: 0, totalInvoiced: 0, totalCollected: 0 };
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get single internship ─────────────────────────────────────────────────
router.get('/:id', internshipAuth, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('leadManager', 'name jobRole email');
    if (!internship) return res.status(404).json({ message: 'Not found' });
    res.json(internship);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update internship (admin/manager) ─────────────────────────────────────
router.put('/:id', internshipAuth, async (req, res) => {
  try {
    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { returnDocument: 'after', runValidators: true }
    ).populate('leadManager', 'name jobRole email');
    if (!internship) return res.status(404).json({ message: 'Not found' });
    res.json(internship);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Delete internship (admin only) ────────────────────────────────────────
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Internship.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

