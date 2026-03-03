// seed.js
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Product = require("./models/Product");
const Transaction = require("./models/Transaction");
const Message = require("./models/Message");
const Escrow = require("./models/Escrow");
const Logistics = require("./models/Logistics");
const Dispute = require("./models/Dispute");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    // await Promise.all([
    //   User.deleteMany(),
    //   Product.deleteMany(),
    //   Transaction.deleteMany(),
    //   Message.deleteMany(),
    //   Escrow.deleteMany(),
    //   Logistics.deleteMany(),
    //   Dispute.deleteMany()
    // ]);

    // Users
    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@agriconnectx.com",
      password: "password123",
      phone:"683394605",
      role: "admin",
      isApproved: true
    });

    const farmer = await User.create({
      firstName: "Alice",
      lastName: "Farmer",
      email: "alice@farm.com",
      password: "password123",
      phone:"683394605",
      role: "farmer",
      isApproved: true,
      farmName: "Green Valley",
      farmLocation: "Village A"
    });

    const buyer = await User.create({
      firstName: "Bob",
      lastName: "Buyer",
      email: "bob@buyer.com",
      password: "password123",
      phone:"683394605",
      role: "buyer",
      isApproved: true
    });

    // Products
    const tomato = await Product.create({
      name: "Tomatoes",
      category: "Vegetables",
      basePrice: 5,
      soldCount: 20,
      views: 100,
      ratings: { average: 4.5 },
      seller: farmer._id
    });

    const maize = await Product.create({
      name: "Maize",
      category: "Grains",
      basePrice: 10,
      soldCount: 15,
      views: 50,
      ratings: { average: 4.2 },
      seller: farmer._id
    });

    // Transaction
    const transaction = await Transaction.create({
      buyer: buyer._id,
      seller: farmer._id,
      products: [
        { name: "Tomatoes", quantity: 10 },
        { name: "Maize", quantity: 5 }
      ],
      totalAmount: 100,
      paymentStatus: "completed"
    });

    // Messages
    await Message.create({
      sender: buyer._id,
      receiver: farmer._id,
      content: "Interested in bulk purchase of maize."
    });

    // Escrow
    await Escrow.create({
      transaction: transaction._id,
      amount: 100,
      status: "pending"
    });

    // Logistics
    await Logistics.create({
      transaction: transaction._id,
      transporter: "FastTruck Ltd",
      status: "in-transit"
    });

    // Dispute
    await Dispute.create({
      transaction: transaction._id,
      reason: "Delayed delivery",
      status: "open"
    });

    console.log("🌱 Seed data inserted successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();