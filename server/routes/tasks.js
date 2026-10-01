const router = require('express').Router();
const Task = require('../models/Task');
const { auth, adminAuth } = require('../middleware/auth');
const { getIO } = require('../socket');
const { sendNotification } = require('../services/pushNotification');

// GET /api/tasks/my — Employee: get assigned tasks
router.get('/my', auth, async (req, res) => {
  try {
    const { status, priority } = req.query;
    const query = { assignedTo: req.user._id };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignedBy', 'name jobRole profilePicture')
      .populate('projectId', 'name clientName')
      .populate('comments.userId', 'name profilePicture')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/tasks/all — Admin: get all tasks
router.get('/all', adminAuth, async (req, res) => {
  try {
    const { status, priority, assignedTo, projectId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name employeeId jobRole profilePicture')
      .populate('assignedBy', 'name jobRole profilePicture')
      .populate('projectId', 'name clientName')
      .populate('comments.userId', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/tasks — Admin: assign new task
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, assignedTo, projectId, priority, dueDate } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Title and Assignee are required' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      assignedTo,
      assignedBy: req.user._id,
      projectId: projectId || null,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'todo',
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name employeeId jobRole profilePicture')
      .populate('assignedBy', 'name jobRole profilePicture')
      .populate('projectId', 'name clientName');

    getIO().to(assignedTo.toString()).emit('task:new', populatedTask);

    sendNotification({
      recipientId: assignedTo,
      title: '🎯 New Task Assigned',
      message: `You were assigned: "${title}" by ${req.user.name}`,
      data: { type: 'task', taskId: task._id.toString() },
    });

    res.status(201).json({ message: 'Task assigned successfully', task: populatedTask });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/tasks/:id/status — Update status & progress (Employee or Admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, progress } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (status) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
        task.progress = 100;
      }
    }
    if (progress !== undefined) {
      task.progress = Math.min(100, Math.max(0, parseInt(progress)));
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name employeeId jobRole profilePicture')
      .populate('assignedBy', 'name jobRole profilePicture')
      .populate('projectId', 'name clientName');

    getIO().emit('task:update', updatedTask);

    res.json({ message: 'Task status updated', task: updatedTask });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/tasks/:id/comments — Add task comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Comment message is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.comments.push({
      userId: req.user._id,
      message: message.trim(),
      createdAt: new Date(),
    });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name employeeId jobRole profilePicture')
      .populate('assignedBy', 'name jobRole profilePicture')
      .populate('comments.userId', 'name profilePicture');

    res.json({ message: 'Comment added', task: updatedTask });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/tasks/:id — Admin: Delete task
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
