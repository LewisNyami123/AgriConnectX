const express = require('express');
const router = express.Router();
const { 
  getMessages, 
  sendMessage, 
  getConversations,
  markAsRead,
  getAllConversations
} = require('../controllers/messageController');
const { protect, admin, farmer, buyer } = require('../middleware/auth');

router.route('/conversations')
  .get(protect, getConversations);

router.route('/admin/conversations')
  .get(protect, admin, getAllConversations);

router.route('/:receiverId')
  .get(protect, getMessages)
  .post(protect, sendMessage);

router.route('/read/:conversationId')
  .put(protect, markAsRead);

module.exports = router;