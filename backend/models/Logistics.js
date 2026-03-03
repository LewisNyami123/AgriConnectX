// models/Logistics.js
const mongoose = require("mongoose");

const LogisticsSchema = new mongoose.Schema({
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  transporter: { type: String },
  status: { type: String, enum: ["pending", "in-transit", "delivered"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Logistics", LogisticsSchema);