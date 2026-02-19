// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true }, // e.g., "userA_userB" or a generated convo id
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  body: { type: String, trim: true },
  attachments: [{
    url: { type: String, required: true },
    mimeType: String,
    filename: String,
    size: Number
  }],
  isRead: { type: Boolean, default: false, index: true },
  isDeletedBySender: { type: Boolean, default: false },
  isDeletedByRecipient: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false }, // for moderation
  deliveredAt: Date,
  readAt: Date,
  metadata: { type: mongoose.Schema.Types.Mixed }, // optional extra data (e.g., client message id)
}, {
  timestamps: true
});

// Compound index to fetch conversation messages quickly (newest first)
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Helper: mark as read (atomic)
messageSchema.statics.markConversationRead = function(conversationId, userId) {
  return this.updateMany(
    { conversationId, to: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  ).exec();
};

// Helper: soft-delete for a user (does not remove DB record)
messageSchema.methods.softDeleteFor = async function(userId) {
  const uid = mongoose.Types.ObjectId(userId);
  if (this.from.equals(uid)) {
    this.isDeletedBySender = true;
  }
  if (this.to.equals(uid)) {
    this.isDeletedByRecipient = true;
  }
  await this.save();
  return this;
};

// Virtual: visible to a given user
messageSchema.methods.isVisibleTo = function(userId) {
  const uid = mongoose.Types.ObjectId(userId);
  if (this.isHidden) return false;
  if (this.from.equals(uid) && this.isDeletedBySender) return false;
  if (this.to.equals(uid) && this.isDeletedByRecipient) return false;
  return true;
};

module.exports = mongoose.model('Message', messageSchema);