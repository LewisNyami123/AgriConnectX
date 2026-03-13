// seedAdmin.js
// require('dotenv').config();
// const mongoose = require('mongoose');
// const User = require('./models/User');

// async function run() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     const result = await User.createAdminIfMissing();
//     if (result.created) {
//       console.log('✅ Admin created:', result.user.email);
//     } else {
//       console.log('⚠️ Admin already exists:', result.user.email);
//     }
//     await mongoose.disconnect();
//     process.exit(0);
//   } catch (err) {
//     console.error('❌ Seed error:', err);
//     process.exit(1);
//   }
// }
// run();

require("dotenv").config();
const mongoose = require("mongoose");

const Product = require("./models/Product");
const User = require("./models/User");

async function run() {

await mongoose.connect(process.env.MONGODB_URI);

console.log("MongoDB connected");

const seller = await User.findOne({ role: "farmer" });

if (!seller) {
console.log("No farmer user found");
process.exit();
}

const products = [];

for (let i = 1; i <= 20; i++) {

products.push({

sku:`SKU-${Date.now()}-${i}`,

title:`Farm Product ${i}`,

description:"Fresh farm produce",

category:"Agriculture",

price:Math.floor(Math.random()*5000)+500,

quantity:100,

seller:seller._id,

images:[
{
url:`https://picsum.photos/seed/${i}/300/300`
}
]

});

}

await Product.deleteMany();

await Product.insertMany(products);

console.log("Products seeded successfully");

await mongoose.disconnect();

process.exit();

}

run();