const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory user cache to avoid DB lookup on every request
// Key: userId, Value: { user, expiresAt }
const userCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

const getCachedUser = async (userId) => {
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }
  const user = await User.findById(userId).select('-password').lean();
  if (user) {
    user._id = user._id; // preserve ObjectId
    userCache.set(userId, { user, expiresAt: Date.now() + CACHE_TTL });
  }
  return user;
};

// Clear stale cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of userCache) {
    if (val.expiresAt < now) userCache.delete(key);
  }
}, 5 * 60 * 1000);

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, access denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'workpulse_secret_key_2024_office_management');
    const user = await getCachedUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      next();
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const internshipAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin' && !req.user.canManageInternships) {
        return res.status(403).json({ message: 'Access denied. Internship management permission required.' });
      }
      next();
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, adminAuth, internshipAuth };
