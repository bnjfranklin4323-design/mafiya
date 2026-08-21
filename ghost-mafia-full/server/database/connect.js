const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ghost-mafia';
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB ulandi');
  } catch (err) {
    console.error('❌ MongoDB ulanish xatosi:', err.message);
    console.error('   .env faylida MONGO_URI to\'g\'ri ko\'rsatilganini tekshiring.');
  }
}

module.exports = connectDB;
