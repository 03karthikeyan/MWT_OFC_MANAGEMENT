
const router = require('express').Router();
const Notification = require('../models/Notification');
const { auth, adminAuth } = require('../middleware/auth');
const { getIO } = require('../socket');

const { sendNotification } = require('../services/pushNotification');

// [Admin] Send a notification
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, message, type, target, recipients, startsAt, expiresAt } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      target: target || 'all',
      recipients: target === 'specific' ? recipients : [],
      sender: req.user._id,
      startsAt: startsAt || Date.now(),
      expiresAt: expiresAt || null,
    });

    // Broadcast real-time notification via Socket and FCM push
    if (target === 'all') {
      sendNotification({
        title,
        message,
        data: { type: 'notification', id: notification._id.toString() },
      });
    } else if (target === 'specific' && recipients && recipients.length) {
      recipients.forEach(userId => {
        sendNotification({
          recipientId: userId,
          title,
          message,
          data: { type: 'notification', id: notification._id.toString() },
        });
      });
    }

    res.status(201).json({ message: 'Notification sent successfully', notification });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// [All] Get my notifications
router.get('/my', auth, async (req, res) => {
  try {
    const now = new Date();
    const notifications = await Notification.find({
      $and: [
        {
          $or: [
            { target: 'all' },
            { recipients: req.user._id }
          ]
        },
        { startsAt: { $lte: now } },
        { 
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null }, 
            { expiresAt: { $gte: now } }
          ] 
        }
      ]
    }).sort({ createdAt: -1 }).limit(10).lean(); // Last 10 notifications
    
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// [Admin] Get all notifications (to manage)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// [Admin] Delete a notification
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
