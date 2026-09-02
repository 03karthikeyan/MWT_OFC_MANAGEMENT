import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/workpulse';

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false }));
    const WorkUpdate = mongoose.model('WorkUpdate', new mongoose.Schema({}, { strict: false }));
    
    const userCount = await User.countDocuments();
    const attendanceCount = await Attendance.countDocuments();
    const workCount = await WorkUpdate.countDocuments();
    
    console.log(`Users: ${userCount}`);
    console.log(`Attendance Records: ${attendanceCount}`);
    console.log(`Work Updates: ${workCount}`);
    
    if (userCount > 0) {
      const lastUser = await User.findOne().sort({ _id: -1 });
      console.log(`Latest User: ${lastUser.username}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkData();
