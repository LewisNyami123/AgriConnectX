const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'document', 'offer'],
    default: 'text'
  },
  mediaUrl: String,
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  repliedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isOffer: {
    type: Boolean,
    default: false
  },
  offerDetails: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    notes: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);