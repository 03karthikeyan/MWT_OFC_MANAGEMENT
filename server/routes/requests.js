const router = require('express').Router();
const Request = require('../models/Request');
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');
const { sendNotification } = require('../services/pushNotification');

// Add a new request or review
router.post('/', auth, async (req, res) => {
  try {
    const { type, subject, description, recipientId, websiteLink } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }
    
    // Validate recipient if specific user provided
    const newRequest = await Request.create({
      userId: req.user._id,
      recipientId: recipientId || null,
      type: type || 'Request',
      subject,
      description,
      websiteLink: websiteLink || null
    });
    if (recipientId) {
      getIO().to(recipientId.toString()).emit('request:new', newRequest);
      sendNotification({
        recipientId,
        title: `📩 New ${type || 'Request'} Received`,
        message: `${req.user.name || 'An employee'} sent: "${subject}"`,
        data: { type: 'requests', requestId: newRequest._id.toString(), screen: 'requests' },
      });
    } else {
      getIO().to('admin').emit('request:new', newRequest);
      sendNotification({
        targetRole: 'admin',
        title: `📩 New ${type || 'Request'} from ${req.user.name || 'Employee'}`,
        message: `Subject: "${subject}"`,
        data: { type: 'requests', requestId: newRequest._id.toString(), screen: 'requests' },
      });
    }
    
    res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get pending request count
router.get('/pending-count', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? { $or: [{ recipientId: req.user._id }, { recipientId: null }], status: 'Pending' } 
      : { recipientId: req.user._id, status: 'Pending' };
      
    const count = await Request.countDocuments(query);
    res.json({ count });
  } catch (err) {
    console.error('Get pending count error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my outgoing requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await Request.find({ userId: req.user._id })
      .populate('recipientId', 'name jobRole profilePicture')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error('Get my requests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get incoming or admin requests
router.get('/incoming', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? { $or: [{ recipientId: req.user._id }, { recipientId: null }] } 
      : { recipientId: req.user._id };
      
    const requests = await Request.find(query)
      .populate('userId', 'name jobRole profilePicture')
      .sort({ createdAt: -1 })
      .lean();
      
    res.json({ requests });
  } catch (err) {
    console.error('Get incoming requests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status or remarks
router.put('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const isCreator = request.userId.toString() === req.user._id.toString();
    const isRecipient = request.recipientId && request.recipientId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isRecipient && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    const { status, remarks, description, subject, websiteLink } = req.body;

    // Creator can update details if pending
    if (isCreator && request.status === 'Pending') {
      if (description) request.description = description;
      if (subject) request.subject = subject;
      if (websiteLink !== undefined) request.websiteLink = websiteLink;
    }

    // Recipient or admin can update status and remarks
    if (isRecipient || isAdmin) {
      if (status) request.status = status;
      if (remarks !== undefined) request.remarks = remarks;
    }

    await request.save();
    
    // Notify creator if recipient or admin updated status/remarks
    if ((isAdmin || isRecipient) && (status || remarks) && isCreator === false) {
      await Notification.create({
        title: `Request ${status?.toUpperCase() || 'Update'}`,
        message: `Your request "${request.subject}" has been updated to ${status || 'New Remarks'}.`,
        type: status === 'Resolved' ? 'info' : 'info',
        target: 'specific',
        recipients: [request.userId],
        sender: req.user._id
      });

      getIO().to(request.userId.toString()).emit('request:status', {
        id: request._id,
        status: request.status,
        message: `Your request "${request.subject}" has been updated to ${status || 'New Remarks'}.`
      });

      sendNotification({
        recipientId: request.userId,
        title: `📌 Request ${status?.toUpperCase() || 'Updated'}`,
        message: `Your request "${request.subject}" is now ${status || 'updated'}.`,
        data: { type: 'requests', requestId: request._id.toString(), screen: 'requests' },
      });
    }

    res.json({ message: 'Request updated', request });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete request
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const isCreator = request.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await request.deleteOne();
    res.json({ message: 'Request deleted' });
  } catch (err) {
    console.error('Delete request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
