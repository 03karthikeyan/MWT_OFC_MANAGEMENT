const router = require('express').Router();
const WorkUpdate = require('../models/WorkUpdate');
const { auth, adminAuth } = require('../middleware/auth');
const { getIO } = require('../socket');
const { sendNotification } = require('../services/pushNotification');

// Add work update
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status, date, projectId } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const work = await WorkUpdate.create({
      userId: req.user._id,
      title,
      description: description || '',
      status: status || 'pending',
      projectId: projectId || null,
      date: date ? new Date(date) : Date.now(),
    });

    const populatedWork = await WorkUpdate.findById(work._id)
      .populate('userId', 'name role profilePicture')
      .populate('projectId', 'name clientName');
    
    getIO().to('admin').emit('work:new', populatedWork);
    getIO().to(req.user._id.toString()).emit('work:new', populatedWork);

    sendNotification({
      targetRole: 'admin',
      title: `💼 Work Update from ${req.user.name || 'Employee'}`,
      message: `${title}: ${description || 'New work entry submitted.'}`,
      data: { type: 'work', workId: work._id.toString(), screen: 'work' },
    });

    res.status(201).json({ message: 'Work update added', workUpdate: work });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get my work updates
router.get('/my', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const query = { userId: req.user._id };

    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const workUpdates = await WorkUpdate.find(query)
      .populate('projectId', 'name clientName')
      .sort({ date: -1 })
      .limit(limit);
    res.json({ workUpdates });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update work
router.put('/:id', auth, async (req, res) => {
  try {
    const work = await WorkUpdate.findById(req.params.id);
    if (!work) {
      return res.status(404).json({ message: 'Work update not found' });
    }
    if (work.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, status, date, projectId } = req.body;
    if (title) work.title = title;
    if (description !== undefined) work.description = description;
    if (status) work.status = status;
    if (date) work.date = new Date(date);
    if (projectId !== undefined) work.projectId = projectId || null;
    
    await work.save();
    res.json({ message: 'Work updated', workUpdate: work });
  } catch (err) {
    console.error('Error updating work:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete work
router.delete('/:id', auth, async (req, res) => {
  try {
    const work = await WorkUpdate.findById(req.params.id);
    if (!work) {
      return res.status(404).json({ message: 'Work update not found' });
    }
    if (work.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await work.deleteOne();
    res.json({ message: 'Work deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all work updates
router.get('/all', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const query = {};

    if (req.query.userId) {
      query.userId = req.query.userId;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const workUpdates = await WorkUpdate.find(query)
      .populate('userId', 'name username employeeId role jobRole profilePicture')
      .populate('projectId', 'name clientName')
      .sort({ date: -1 })
      .limit(limit)
      .lean();
    res.json({ workUpdates });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
