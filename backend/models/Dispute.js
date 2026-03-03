// models/Dispute.js
const mongoose = require("mongoose");

const DisputeSchema = new mongoose.Schema({
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  reason: { type: String, required: true },
  status: { type: String, enum: ["open", "resolved"], default: "open" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Dispute", DisputeSchema);