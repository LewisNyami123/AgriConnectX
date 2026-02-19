// scripts/create_indexes_and_backfill_authorName.js
require('dotenv').config();
const mongoose = require('mongoose');

const Resource = require('../models/Resource');
const User = require('../models/User');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  try {
    console.log('Ensuring indexes...');
    await Resource.syncIndexes();
    console.log('Indexes ensured.');

    console.log('Backfilling authorName for resources missing it...');
    const cursor = Resource.find({ $or: [{ authorName: { $exists: false } }, { authorName: '' }], author: { $exists: true } }).cursor();
    let count = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      try {
        const user = await User.findById(doc.author).select('firstName lastName');
        if (user) {
          doc.authorName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          await doc.save();
          count++;
        }
      } catch (err) {
        console.warn('Failed to backfill for resource', doc._id, err.message);
      }
    }
    console.log(`Backfilled authorName for ${count} resources.`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  }
}

main();