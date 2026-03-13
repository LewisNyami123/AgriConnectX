// models/Dispute.js
const mongoose = require('mongoose');
const DisputeSchema = new mongoose.Schema({

 transaction: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Transaction",
  required: true
 },

 openedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
 },

 reason: {
  type: String,
  required: true
 },

 evidence: String,

 status: {
  type: String,
  enum: ["open", "resolved", "rejected"],
  default: "open"
 }

}, { timestamps: true });

module.exports = mongoose.model('Dispute',DisputeSchema);