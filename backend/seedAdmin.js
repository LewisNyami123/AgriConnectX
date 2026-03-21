require("dotenv").config();
const mongoose = require("mongoose");

const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order"); // ensure you have this model

async function seedProducts(farmer) {
  await Product.deleteMany();
  console.log("🗑️ Existing products deleted");

  const productData = [
    { title: "Maize (Corn)", category: "Cereals", price: 500, quantity: 200 },
    { title: "Cassava", category: "Roots", price: 300, quantity: 300 },
    { title: "Cocoa Beans", category: "Cash Crops", price: 1800, quantity: 150 },
    { title: "Plantains", category: "Fruits", price: 600, quantity: 100 },
    { title: "Groundnuts (Peanuts)", category: "Legumes", price: 1200, quantity: 250 },
    { title: "Onions", category: "Vegetables", price: 700, quantity: 180 },
    { title: "Tomatoes", category: "Vegetables", price: 500, quantity: 220 },
    { title: "Yams", category: "Roots", price: 800, quantity: 140 },
    { title: "Rice", category: "Cereals", price: 900, quantity: 300 },
    { title: "Palm Oil", category: "Oil", price: 1200, quantity: 100 },
    { title: "Bananas", category: "Fruits", price: 400, quantity: 150 },
    { title: "Sweet Potatoes", category: "Roots", price: 500, quantity: 180 },
    { title: "Cabbage", category: "Vegetables", price: 600, quantity: 120 },
    { title: "Chili Peppers", category: "Vegetables", price: 700, quantity: 90 },
    { title: "Okra", category: "Vegetables", price: 500, quantity: 160 },
    { title: "Millet", category: "Cereals", price: 800, quantity: 200 },
    { title: "Soybeans", category: "Legumes", price: 1000, quantity: 150 },
    { title: "Pineapples", category: "Fruits", price: 800, quantity: 100 },
    { title: "Avocados", category: "Fruits", price: 700, quantity: 120 },
    { title: "Beans", category: "Legumes", price: 1000, quantity: 200 }
  ];

  const products = productData.map((p, idx) => ({
    sku: `SKU-${Date.now()}-${idx}`,
    description: `Fresh ${p.title} from Cameroon`,
    seller: farmer._id,
    isVerified: true,
    images: [{ url: "https://source.unsplash.com/300x300/?cameroon,agriculture" }],
    ...p
  }));

  await Product.insertMany(products);
  console.log("🌍 20 Cameroon agricultural products seeded successfully");
}

async function seedOrders(farmer, buyer) {
  await Order.deleteMany();
  console.log("🗑️ Existing orders deleted");

  const products = await Product.find({ seller: farmer._id }).limit(20);

  const orders = products.map((product, idx) => {
    const qty = Math.floor(Math.random() * 5) + 1;
    return {
      orderNumber: `ORD-${Date.now()}-${idx}`,
      buyer: buyer._id,
      farmer: farmer._id,
      products: [{ product: product._id, quantity: qty, price: product.price }],
      status: "pending",
      amount: product.price * qty,
      createdAt: new Date()
    };
  });

  await Order.insertMany(orders);
  console.log("📦 20 sample orders seeded successfully");
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    const farmer = await User.findOne({ role: "farmer" });
    const buyer = await User.findOne({ role: "buyer" });

    if (!farmer || !buyer) {
      console.log("Farmer or Buyer user not found");
      return;
    }

    await seedProducts(farmer);
    await seedOrders(farmer, buyer);

  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
    process.exit(0);
  }
}

run();