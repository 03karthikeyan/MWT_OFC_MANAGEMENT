const router = require('express').Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { getIO } = require('../socket');
const { sendNotification } = require('../services/pushNotification');

// Safe ObjectId helper
const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (_) {
    return null;
  }
};

// GET /api/chat/users — Get list of team members to chat with
router.get('/users', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentObjId = toObjectId(currentUserId);

    // Fetch all users except self
    const query = currentObjId ? { _id: { $ne: currentObjId } } : { _id: { $ne: currentUserId } };
    const users = await User.find(query)
      .select('name username role jobRole department profilePicture status createdAt')
      .lean();

    // Attach last message and unread count for each user
    const teamChatList = await Promise.all(
      users.map(async (u) => {
        const uObjId = toObjectId(u._id);
        const orConditions = [];

        if (currentObjId && uObjId) {
          orConditions.push(
            { senderId: currentObjId, receiverId: uObjId },
            { senderId: uObjId, receiverId: currentObjId }
          );
        } else {
          orConditions.push(
            { senderId: currentUserId, receiverId: u._id },
            { senderId: u._id, receiverId: currentUserId }
          );
        }

        const lastMsg = await Message.findOne({ $or: orConditions })
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = await Message.countDocuments({
          senderId: uObjId || u._id,
          receiverId: currentObjId || currentUserId,
          read: false,
        });

        return {
          ...u,
          lastMessage: lastMsg ? lastMsg.content : null,
          lastMessageTime: lastMsg ? lastMsg.createdAt : null,
          unreadCount: unreadCount || 0,
        };
      })
    );

    // Sort by last message time descending (recent chats on top)
    teamChatList.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      if (timeA === 0 && timeB === 0) {
        return (a.name || '').localeCompare(b.name || '');
      }
      return timeB - timeA;
    });

    res.json({ users: teamChatList });
  } catch (err) {
    console.error('Error fetching chat users:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/chat/messages/:otherUserId — Get message thread history
router.get('/messages/:otherUserId', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.otherUserId;

    const currentObjId = toObjectId(currentUserId);
    const otherObjId = toObjectId(otherUserId);

    if (!otherObjId && !otherUserId) {
      return res.status(400).json({ message: 'Invalid target user ID' });
    }

    const orConditions = [];
    if (currentObjId && otherObjId) {
      orConditions.push(
        { senderId: currentObjId, receiverId: otherObjId },
        { senderId: otherObjId, receiverId: currentObjId }
      );
    } else {
      orConditions.push(
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      );
    }

    const messages = await Message.find({ $or: orConditions })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name profilePicture jobRole')
      .populate('receiverId', 'name profilePicture jobRole')
      .lean();

    // Mark incoming messages as read
    await Message.updateMany(
      {
        senderId: otherObjId || otherUserId,
        receiverId: currentObjId || currentUserId,
        read: false,
      },
      { $set: { read: true } }
    );

    res.json({ messages });
  } catch (err) {
    console.error('Error fetching messages history:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/chat/messages — Send direct message (REST fallback + Socket emit)
router.post('/messages', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content || !content.trim()) {
      return res.status(400).json({ message: 'Receiver and message content are required' });
    }

    const currentObjId = toObjectId(req.user._id) || req.user._id;
    const receiverObjId = toObjectId(receiverId) || receiverId;

    const message = await Message.create({
      senderId: currentObjId,
      receiverId: receiverObjId,
      content: content.trim(),
    });

    const populatedMsg = await Message.findById(message._id)
      .populate('senderId', 'name profilePicture jobRole')
      .populate('receiverId', 'name profilePicture jobRole');

    // Emit real-time Socket.io event to recipient & sender
    try {
      const io = getIO();
      io.to(receiverId.toString()).emit('new_message', populatedMsg);
      io.to(req.user._id.toString()).emit('message_sent', populatedMsg);
    } catch (_) {}

    // Send Push Notification alert to receiver
    try {
      sendNotification({
        recipientId: receiverId,
        title: `Message from ${req.user.name}`,
        message: content.trim(),
        data: { type: 'chat', senderId: req.user._id.toString() },
      });
    } catch (_) {}

    res.status(201).json({ message: populatedMsg });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/chat/read/:otherUserId — Mark messages from specific user as read
router.put('/read/:otherUserId', auth, async (req, res) => {
  try {
    const currentObjId = toObjectId(req.user._id) || req.user._id;
    const otherObjId = toObjectId(req.params.otherUserId) || req.params.otherUserId;

    await Message.updateMany(
      { senderId: otherObjId, receiverId: currentObjId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
