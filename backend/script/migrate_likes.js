// scripts/migrate_likes.js
require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('../models/Resource');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const cursor = Resource.find({ likes: { $exists: true } }).cursor();
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    if (doc.likes.length && typeof doc.likes[0] === 'object' && doc.likes[0].user) {
      doc.likes = doc.likes.map(l => l.user);
      await doc.save();
    }
  }
  await mongoose.disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });
