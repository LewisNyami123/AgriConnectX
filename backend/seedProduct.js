require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

mongoose.connect(process.env.MONGO_URI);



async function seed(){

await Product.deleteMany();

await Product.insertMany(products);

console.log("Products seeded");

process.exit();

}

seed();