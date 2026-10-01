const router = require('express').Router();
const Expense = require('../models/Expense');
const { auth, adminAuth } = require('../middleware/auth');
const { sendNotification } = require('../services/pushNotification');

// GET /api/expenses/my — Employee: my expense claims
router.get('/my', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/expenses/all — Admin: all expense claims
router.get('/all', adminAuth, async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const expenses = await Expense.find(query)
      .populate('userId', 'name employeeId jobRole profilePicture')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/expenses — Employee: submit expense claim
router.post('/', auth, async (req, res) => {
  try {
    const { title, category, amount, date, description, receiptUrl } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ message: 'Title and Amount are required' });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      title: title.trim(),
      category: category || 'Other',
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      description: description || '',
      receiptUrl: receiptUrl || '',
      status: 'pending',
    });

    sendNotification({
      targetRole: 'admin',
      title: '🧾 New Expense Claim',
      message: `${req.user.name} submitted an expense claim of ₹${amount} (${title})`,
      data: { type: 'expense', expenseId: expense._id.toString() },
    });

    res.status(201).json({ message: 'Expense submitted successfully', expense });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/expenses/:id/status — Admin: approve/reject/reimburse
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected', 'reimbursed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    expense.status = status;
    expense.reviewedBy = req.user._id;
    if (reviewNote) expense.reviewNote = reviewNote;
    if (status === 'reimbursed') expense.reimbursedAt = new Date();

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('userId', 'name employeeId jobRole profilePicture')
      .populate('reviewedBy', 'name');

    sendNotification({
      recipientId: expense.userId,
      title: `Expense Claim ${status.toUpperCase()}`,
      message: `Your expense claim for "${expense.title}" (₹${expense.amount}) has been ${status}.`,
      data: { type: 'expense_status', status },
    });

    res.json({ message: `Expense marked as ${status}`, expense: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    if (expense.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
