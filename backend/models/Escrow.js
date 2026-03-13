// models/Escrow.js
const mongoose = require('mongoose');
const EscrowSchema = new mongoose.Schema({

 transaction: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Transaction",
  required: true
 },

 buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

 farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

 amount: { type: Number, required: true },

 status: {
  type: String,
  enum: ["pending", "released", "disputed"],
  default: "pending"
 }

}, { timestamps: true });

module.exports = mongoose.model('Escrow', EscrowSchema);