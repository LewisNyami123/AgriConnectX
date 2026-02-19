// scripts/test_resource_helpers.js
require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('../models/Resource');

const RESOURCE_ID = process.env.RESOURCE_ID; // set in env or replace here
const USER_ID = process.env.USER_ID; // set in env or replace here

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const r = await Resource.findById(RESOURCE_ID);
  if (!r) { console.error('Resource not found'); process.exit(1); }

  console.log('Initial views:', r.views, 'likes:', r.likes.length);

  const updated = await r.incrementViews();
  console.log('After incrementViews:', updated.views);

  const likeCount = await r.toggleLike(USER_ID);
  console.log('After toggleLike, likes:', likeCount);

  // toggle again to remove
  const likeCount2 = await r.toggleLike(USER_ID);
  console.log('After toggleLike again, likes:', likeCount2);

  await mongoose.disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });