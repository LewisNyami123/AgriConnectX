const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get messages with a specific user
// @route   GET /api/messages/:receiverId
// @access  Private
const getMessages = asyncHandler(async (req, res, next) => {
  const currentUser = req.user.id;
  const receiverId = req.params.receiverId;

  // Verify receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(new ErrorResponse(`Receiver not found with id of ${receiverId}`, 404));
  }

  // Create conversation ID (sorted to ensure consistent ordering)
  const userIds = [currentUser, receiverId].sort();
  const conversationId = `${userIds[0]}_${userIds[1]}`;

  const messages = await Message.find({
    conversationId
  })
    .populate('sender', 'firstName lastName profilePicture')
    .populate('receiver', 'firstName lastName profilePicture')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Send a message
// @route   POST /api/messages/:receiverId
// @access  Private
const sendMessage = asyncHandler(async (req, res, next) => {
  const { message, messageType, mediaUrl, isOffer, offerDetails } = req.body;
  const senderId = req.user.id;
  const receiverId = req.params.receiverId;

  // Verify receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(new ErrorResponse(`Receiver not found with id of ${receiverId}`, 404));
  }

  // Create conversation ID (sorted to ensure consistent ordering)
  const userIds = [senderId, receiverId].sort();
  const conversationId = `${userIds[0]}_${userIds[1]}`;

  const newMessage = await Message.create({
    sender: senderId,
    receiver: receiverId,
    conversationId,
    message,
    messageType: messageType || 'text',
    mediaUrl,
    isOffer: isOffer || false,
    offerDetails: isOffer ? offerDetails : undefined
  });

  const populatedMessage = await Message.findById(newMessage._id)
    .populate('sender', 'firstName lastName profilePicture')
    .populate('receiver', 'firstName lastName profilePicture');

  // In a real implementation, emit this to socket.io for real-time updates
  // io.to(conversationId).emit('newMessage', populatedMessage);

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// @desc    Get user conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Find all messages where user is either sender or receiver
  const messages = await Message.find({
    $or: [
      { sender: userId },
      { receiver: userId }
    ]
  }).sort({ createdAt: -1 });

  // Extract unique conversation IDs
  const conversationIds = [...new Set(messages.map(msg => msg.conversationId))];

  // Get latest message from each conversation
  const conversations = [];

  for (const convId of conversationIds) {
    const latestMessage = await Message.findOne({
      conversationId: convId
    })
      .populate('sender', 'firstName lastName profilePicture')
      .populate('receiver', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    // Determine other participant in the conversation
    let otherParticipant = null;
    if (latestMessage.sender._id.toString() === userId) {
      otherParticipant = latestMessage.receiver;
    } else {
      otherParticipant = latestMessage.sender;
    }

    // Count unread messages for this user
    const unreadCount = await Message.countDocuments({
      conversationId: convId,
      receiver: userId,
      read: false
    });

    conversations.push({
      conversationId: convId,
      otherParticipant,
      latestMessage: {
        message: latestMessage.message,
        messageType: latestMessage.messageType,
        createdAt: latestMessage.createdAt
      },
      unreadCount
    });
  }

  // Sort conversations by latest message date
  conversations.sort((a, b) => b.latestMessage.createdAt - a.latestMessage.createdAt);

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:conversationId
// @access  Private
const markAsRead = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const conversationId = req.params.conversationId;

  await Message.updateMany(
    {
      conversationId,
      receiver: userId,
      read: false
    },
    {
      read: true,
      readAt: Date.now()
    }
  );

  res.status(200).json({
    success: true,
    message: 'Messages marked as read'
  });
});

// @desc    Get all conversations for admin
// @route   GET /api/messages/admin/conversations
// @access  Private/Admin
const getAllConversations = asyncHandler(async (req, res, next) => {
  // Find all unique conversation IDs
  const messages = await Message.find().sort({ createdAt: -1 });
  const conversationIds = [...new Set(messages.map(msg => msg.conversationId))];

  const conversations = [];

  for (const convId of conversationIds) {
    const latestMessage = await Message.findOne({
      conversationId: convId
    })
      .populate('sender', 'firstName lastName email')
      .populate('receiver', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const participants = convId.split('_');
    const participant1 = await User.findById(participants[0]).select('firstName lastName email');
    const participant2 = await User.findById(participants[1]).select('firstName lastName email');

    const messageCount = await Message.countDocuments({ conversationId: convId });

    conversations.push({
      conversationId: convId,
      participants: [participant1, participant2],
      latestMessage: {
        message: latestMessage.message,
        createdAt: latestMessage.createdAt
      },
      messageCount
    });
  }

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

module.exports = { getMessages, 
  sendMessage, 
  getConversations,
  markAsRead,
  getAllConversations}