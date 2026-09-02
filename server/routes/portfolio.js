const router = require('express').Router();
const Portfolio = require('../models/Portfolio');
const { auth, adminAuth } = require('../middleware/auth');

// Add portfolio (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, clientName, description, category, thumbnail, liveLink, completionDate, isFeatured } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    const portfolio = await Portfolio.create({
      title,
      clientName,
      description,
      category: category || 'Web Development',
      thumbnail,
      liveLink,
      completionDate,
      isFeatured: isFeatured || false
    });
    res.status(201).json({ message: 'Portfolio item added', portfolio });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all portfolio items
router.get('/', auth, async (req, res) => {
  try {
    const portfolios = await Portfolio.find().sort({ createdAt: -1 });
    res.json({ portfolios });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update portfolio (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    const { title, clientName, description, category, thumbnail, liveLink, completionDate, isFeatured } = req.body;
    if (title) portfolio.title = title;
    if (clientName) portfolio.clientName = clientName;
    if (description !== undefined) portfolio.description = description;
    if (category) portfolio.category = category;
    if (thumbnail) portfolio.thumbnail = thumbnail;
    if (liveLink) portfolio.liveLink = liveLink;
    if (completionDate) portfolio.completionDate = completionDate;
    if (isFeatured !== undefined) portfolio.isFeatured = isFeatured;
    
    await portfolio.save();
    res.json({ message: 'Portfolio updated', portfolio });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete portfolio (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    await portfolio.deleteOne();
    res.json({ message: 'Portfolio deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
