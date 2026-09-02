const router = require('express').Router();
const Project = require('../models/Project');
const { auth, adminAuth } = require('../middleware/auth');
const { getIO } = require('../socket');

// Add project (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, clientName, description, status, deadline, budget, priority, teamMembers } = req.body;
    if (!name || !clientName) {
      return res.status(400).json({ message: 'Name and client name are required' });
    }
    const project = await Project.create({
      name,
      clientName,
      description,
      status: status || 'In Progress',
      deadline,
      budget,
      priority: priority || 'Medium',
      teamMembers: teamMembers || []
    });

    const io = getIO();
    io.emit('project:update', project);

    res.status(201).json({ message: 'Project created', project });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('teamMembers.user', 'name username employeeId role jobRole profilePicture')
      .sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update project (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { name, clientName, description, status, deadline, budget, priority, progress, teamMembers } = req.body;
    if (name) project.name = name;
    if (clientName) project.clientName = clientName;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (deadline) project.deadline = deadline;
    if (budget) project.budget = budget;
    if (priority) project.priority = priority;
    if (progress !== undefined) project.progress = progress;
    if (teamMembers) project.teamMembers = teamMembers;
    
    await project.save();
    
    const io = getIO();
    io.emit('project:update', project);

    res.json({ message: 'Project updated', project });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete project (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    await project.deleteOne();

    const io = getIO();
    io.emit('project:delete', req.params.id);

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
