const router = require('express').Router();
const Enquiry = require('../models/Enquiry');
const { auth } = require('../middleware/auth');

// Get all enquiries
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin' && !req.user.canManageEnquiries) {
      query.createdBy = req.user._id;
    }
    const enquiries = await Enquiry.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ enquiries });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create enquiry
router.post('/', auth, async (req, res) => {
  try {
    const newEnquiry = new Enquiry({
      ...req.body,
      createdBy: req.user._id
    });
    await newEnquiry.save();
    res.status(201).json({ message: 'Enquiry created successfully', enquiry: newEnquiry });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update enquiry
router.put('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin' && !req.user.canManageEnquiries) {
      query.createdBy = req.user._id;
    }
    const updatedEnquiry = await Enquiry.findOneAndUpdate(query, req.body, { returnDocument: 'after' });
    if (!updatedEnquiry) {
      return res.status(404).json({ message: 'Enquiry not found or unauthorized' });
    }
    res.json({ message: 'Enquiry updated successfully', enquiry: updatedEnquiry });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete enquiry
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.canManageEnquiries) {
      return res.status(403).json({ message: 'Forbidden: Unauthorized' });
    }
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Enquiry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
