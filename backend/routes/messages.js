// routes/messages.js
const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  getConversations,
  markAsRead,
  getAllConversations
} = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

// User conversations (private)
router.route('/conversations')
  .get(protect, getConversations);

// Admin: view all conversations
router.route('/admin/conversations')
  .get(protect, authorize('admin'), getAllConversations);

// Messages to a specific receiver
router.route('/:receiverId')
  .get(protect, getMessages)
  .post(protect, sendMessage);

// Mark conversation messages as read
router.route('/read/:conversationId')
  .put(protect, markAsRead);

module.exports = router;