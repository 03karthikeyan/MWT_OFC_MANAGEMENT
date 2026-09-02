const router = require('express').Router();
const Lead = require('../models/Lead');
const { auth } = require('../middleware/auth');

// Get all leads
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin' && !req.user.canManageLeads) {
      query.createdBy = req.user._id;
    }
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create lead
router.post('/', auth, async (req, res) => {
  try {
    const newLead = new Lead({
      ...req.body,
      createdBy: req.user._id
    });
    await newLead.save();
    res.status(201).json({ message: 'Lead created successfully', lead: newLead });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update lead
router.put('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin' && !req.user.canManageLeads) {
      query.createdBy = req.user._id;
    }
    const updatedLead = await Lead.findOneAndUpdate(query, req.body, { returnDocument: 'after' });
    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found or unauthorized' });
    }
    res.json({ message: 'Lead updated successfully', lead: updatedLead });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete lead
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !req.user.canManageLeads) {
      return res.status(403).json({ message: 'Forbidden: Unauthorized' });
    }
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
