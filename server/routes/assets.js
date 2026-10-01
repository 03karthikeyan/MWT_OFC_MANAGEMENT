const router = require('express').Router();
const Asset = require('../models/Asset');
const { auth, adminAuth } = require('../middleware/auth');
const { sendNotification } = require('../services/pushNotification');

// GET /api/assets/my — Employee: view assigned assets
router.get('/my', auth, async (req, res) => {
  try {
    const assets = await Asset.find({ assignedTo: req.user._id, status: 'allocated' })
      .sort({ allocatedDate: -1 });
    res.json({ assets });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/assets/all — Admin: view all assets & filter
router.get('/all', adminAuth, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const assets = await Asset.find(query)
      .populate('assignedTo', 'name employeeId jobRole department profilePicture')
      .sort({ createdAt: -1 });
    res.json({ assets });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/assets — Admin: register new asset
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, category, assetTag, serialNumber, specifications, condition, assignedTo } = req.body;
    if (!name || !assetTag) {
      return res.status(400).json({ message: 'Asset Name and Asset Tag are required' });
    }

    const existing = await Asset.findOne({ assetTag: assetTag.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Asset Tag already exists' });
    }

    const asset = await Asset.create({
      name: name.trim(),
      category: category || 'Laptop',
      assetTag: assetTag.trim(),
      serialNumber: serialNumber || '',
      specifications: specifications || '',
      condition: condition || 'Good',
      assignedTo: assignedTo || null,
      status: assignedTo ? 'allocated' : 'available',
      allocatedDate: assignedTo ? new Date() : null,
    });

    if (assignedTo) {
      sendNotification({
        recipientId: assignedTo,
        title: '💻 Asset Allocated',
        message: `Asset ${asset.name} (${asset.assetTag}) has been assigned to you.`,
        data: { type: 'asset' },
      });
    }

    res.status(201).json({ message: 'Asset created successfully', asset });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/assets/:id/allocate — Admin: assign or de-assign asset
router.put('/:id/allocate', adminAuth, async (req, res) => {
  try {
    const { assignedTo, status, condition } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    if (assignedTo) {
      asset.assignedTo = assignedTo;
      asset.status = 'allocated';
      asset.allocatedDate = new Date();
      asset.returnDate = null;
    } else {
      asset.assignedTo = null;
      asset.status = status || 'available';
      asset.returnDate = new Date();
    }
    if (condition) asset.condition = condition;

    await asset.save();
    const populated = await Asset.findById(asset._id).populate('assignedTo', 'name employeeId jobRole');

    res.json({ message: 'Asset status updated', asset: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/assets/:id — Admin: remove asset
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
