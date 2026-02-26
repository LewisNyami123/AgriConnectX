// models/Conversation.js
const mongoose = require('mongoose');

const LastMessageSchema = new mongoose.Schema({
  text: { type: String },
  messageType: { type: String, enum: ['text', 'image', 'offer', 'system'], default: 'text' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: LastMessageSchema, default: null },
  lastUpdated: { type: Date, default: Date.now, index: true },
  // unreadCounts is a map of userId -> number
  unreadCounts: { type: Map, of: Number, default: {} },
  isArchived: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Ensure participants array has at least two participants in application logic
ConversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
