// models/Transaction.js (improved)
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `tx_${uuidv4()}`
  },
  idempotencyKey: { type: String, index: true }, // client-provided or server-generated
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true, enum: ['mtn_momo', 'orange_money', 'bank_transfer', 'cash'] },
  paymentStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
  paymentReference: { type: String, index: true }, // provider reference
  paymentDetails: {
    transactionRef: String,
    phoneNumber: String,
    provider: String,
    fee: Number
  },
  paymentEvents: [{ // audit trail for webhooks
    event: String,
    payload: mongoose.Schema.Types.Mixed,
    receivedAt: { type: Date, default: Date.now }
  }],
  deliveryAddress: {
    street: String,
    city: String,
    region: String,
    department: String,
    country: { type: String, default: 'Cameroon' },
    coordinates: [Number]
  },
  deliveryStatus: { type: String, enum: ['pending', 'in_transit', 'delivered', 'cancelled'], default: 'pending' },
  deliveryDate: Date,
  rating: { type: Number, min: 1, max: 5 },
  review: String,
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
}, { timestamps: true });

// Ensure totalAmount matches sum of product totals
transactionSchema.pre('validate', function(next) {
  if (!this.products || this.products.length === 0) return next();
  const sum = this.products.reduce((s, p) => s + (p.totalPrice || (p.unitPrice * p.quantity)), 0);
  this.totalAmount = sum;
  next();
});

// Indexes for fast lookups
// transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ 'paymentDetails.transactionRef': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);