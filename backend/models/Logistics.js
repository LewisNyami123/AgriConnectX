// models/Logistics.js
const mongoose = require('mongoose')
const LogisticsSchema = new mongoose.Schema({

 transaction: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Transaction",
  required: true
 },

 transporter: String,
 trackingNumber: String,

 status: {
  type: String,
  enum: ["pending", "in-transit", "delivered"],
  default: "pending"
 },

 deliveryAddress: String

}, { timestamps: true });

module.exports = mongoose.model('Logistics', LogisticsSchema)