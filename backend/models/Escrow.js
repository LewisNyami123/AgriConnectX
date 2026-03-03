// models/Escrow.js
const mongoose = require("mongoose");

const EscrowSchema = new mongoose.Schema({
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "released", "disputed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Escrow", EscrowSchema);