// seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await User.createAdminIfMissing();
    if (result.created) {
      console.log('✅ Admin created:', result.user.email);
    } else {
      console.log('⚠️ Admin already exists:', result.user.email);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}
run();