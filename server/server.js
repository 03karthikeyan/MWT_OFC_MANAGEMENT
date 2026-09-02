const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { initSocket } = require('./socket');
const morgan = require("morgan");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workpulse')
  .then(async () => {
    console.log('✅ MongoDB connected');
    // Create default admin if not exists
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin',
        email: 'admin@mediawave.com',
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Default admin created (admin / admin123)');
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/work', require('./routes/work'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/projects', require('./routes/project'));
app.use('/api/portfolios', require('./routes/portfolio'));
app.use('/api/payslips', require('./routes/payslip'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/internships', require('./routes/internship'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/onduty', require('./routes/onduty'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/chat', require('./routes/chat'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = server;
