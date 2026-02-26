// controllers/messageController.js
const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation'); // optional but recommended
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// Helper: build deterministic conversationId
function makeConversationId(a, b) {
  return [a.toString(), b.toString()].sort().join('_');
}

// GET /api/messages/:receiverId?page=1&limit=50
const getMessages = asyncHandler(async (req, res, next) => {
  const currentUser = req.user.id;
  const receiverId = req.params.receiverId;

  // validate receiver
  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return next(new ErrorResponse('Invalid receiver id', 400));
  }
  const receiver = await User.findById(receiverId).select('firstName lastName profilePicture');
  if (!receiver) return next(new ErrorResponse(`Receiver not found with id of ${receiverId}`, 404));

  const conversationId = makeConversationId(currentUser, receiverId);

  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
  const skip = (page - 1) * limit;

  const messages = await Message.find({ conversationId })
    .populate('sender', 'firstName lastName profilePicture')
    .populate('receiver', 'firstName lastName profilePicture')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    page,
    limit,
    count: messages.length,
    data: messages
  });
});

// POST /api/messages/:receiverId
const sendMessage = asyncHandler(async (req, res, next) => {
  const { message, messageType = 'text', media = [], isOffer = false, offerDetails } = req.body;
  const senderId = req.user.id;
  const receiverId = req.params.receiverId;

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return next(new ErrorResponse('Invalid receiver id', 400));
  }
  if (!message && (!media || media.length === 0) && !isOffer) {
    return next(new ErrorResponse('Message text, media, or offer required', 400));
  }

  const receiver = await User.findById(receiverId).select('firstName lastName profilePicture');
  if (!receiver) return next(new ErrorResponse(`Receiver not found with id of ${receiverId}`, 404));

  const conversationId = makeConversationId(senderId, receiverId);

  // Persist message
  const newMessage = await Message.create({
    sender: senderId,
    receiver: receiverId,
    conversationId,
    message,
    messageType,
    media,
    isOffer: !!isOffer,
    offerDetails: isOffer ? offerDetails : undefined,
    read: false
  });

  // Update or create conversation metadata (fast lookup for inbox)
  try {
    await Conversation.findOneAndUpdate(
      { conversationId },
      {
        $set: {
          conversationId,
          lastMessage: {
            text: message || (media[0] && media[0].url) || (isOffer ? 'Offer' : ''),
            messageType,
            createdAt: newMessage.createdAt
          },
          lastUpdated: new Date()
        },
        $inc: { [`unreadCounts.${receiverId}`]: 1 },
        $addToSet: { participants: { $each: [senderId, receiverId] } }
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    // non-fatal: log and continue
    console.warn('Conversation update failed', err.message);
  }

  const populatedMessage = await Message.findById(newMessage._id)
    .populate('sender', 'firstName lastName profilePicture')
    .populate('receiver', 'firstName lastName profilePicture');

  // Emit via Socket.io if available
  const io = req.app && req.app.get('io');
  if (io) {
    // room per conversation and personal rooms per user
    io.to(conversationId).emit('newMessage', populatedMessage);
    io.to(`user:${receiverId}`).emit('notification', {
      type: 'message',
      conversationId,
      message: {
        _id: populatedMessage._id,
        text: populatedMessage.message,
        messageType: populatedMessage.messageType,
        createdAt: populatedMessage.createdAt,
        sender: populatedMessage.sender
      }
    });
  }

  res.status(201).json({ success: true, data: populatedMessage });
});

// GET /api/messages/conversations?page=1&limit=50
const getConversations = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
  const skip = (page - 1) * limit;

  // If Conversation model exists, use it for efficient listing
  if (Conversation) {
    const query = { participants: userId };
    const [total, convs] = await Promise.all([
      Conversation.countDocuments(query),
      Conversation.find(query)
        .sort({ lastUpdated: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    // Populate other participant and latest message
    const results = await Promise.all(convs.map(async (c) => {
      const participants = (c.participants || []).filter(p => p.toString() !== userId.toString());
      const otherId = participants[0] || c.participants.find(p => p.toString() !== userId.toString());
      const other = otherId ? await User.findById(otherId).select('firstName lastName profilePicture') : null;
      const unread = (c.unreadCounts && c.unreadCounts[userId]) ? c.unreadCounts[userId] : 0;
      return {
        conversationId: c.conversationId,
        otherParticipant: other,
        latestMessage: c.lastMessage,
        unreadCount: unread
      };
    }));

    return res.status(200).json({ success: true, page, limit, total, count: results.length, data: results });
  }

  // Fallback: scan messages (less efficient)
  const messages = await Message.find({ $or: [{ sender: userId }, { receiver: userId }] }).sort({ createdAt: -1 }).lean();
  const conversationIds = [...new Set(messages.map(m => m.conversationId))].slice(skip, skip + limit);

  const conversations = await Promise.all(conversationIds.map(async (convId) => {
    const latestMessage = await Message.findOne({ conversationId: convId }).sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName profilePicture')
      .populate('receiver', 'firstName lastName profilePicture');
    const participants = convId.split('_');
    const otherId = participants.find(p => p !== userId);
    const other = otherId ? await User.findById(otherId).select('firstName lastName profilePicture') : null;
    const unreadCount = await Message.countDocuments({ conversationId: convId, receiver: userId, read: false });
    return {
      conversationId: convId,
      otherParticipant: other,
      latestMessage: {
        message: latestMessage.message,
        messageType: latestMessage.messageType,
        createdAt: latestMessage.createdAt
      },
      unreadCount
    };
  }));

  res.status(200).json({ success: true, page, limit, count: conversations.length, data: conversations });
});

// PUT /api/messages/read/:conversationId
const markAsRead = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const conversationId = req.params.conversationId;

  await Message.updateMany(
    { conversationId, receiver: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  // Update conversation unreadCounts if model exists
  if (Conversation) {
    await Conversation.updateOne({ conversationId }, { $set: { [`unreadCounts.${userId}`]: 0 } }).exec();
  }

  // Emit read receipt
  const io = req.app && req.app.get('io');
  if (io) io.to(conversationId).emit('messagesRead', { conversationId, userId });

  res.status(200).json({ success: true, message: 'Messages marked as read' });
});

// GET /api/messages/admin/conversations?page=1&limit=50
const getAllConversations = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new ErrorResponse('Not authorized', 403));
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '50', 10));
  const skip = (page - 1) * limit;

  if (Conversation) {
    const [total, convs] = await Promise.all([
      Conversation.countDocuments(),
      Conversation.find().sort({ lastUpdated: -1 }).skip(skip).limit(limit).lean()
    ]);

    const results = await Promise.all(convs.map(async (c) => {
      const participants = c.participants || [];
      const pDocs = await User.find({ _id: { $in: participants } }).select('firstName lastName email');
      const messageCount = await Message.countDocuments({ conversationId: c.conversationId });
      return {
        conversationId: c.conversationId,
        participants: pDocs,
        latestMessage: c.lastMessage,
        messageCount
      };
    }));

    return res.status(200).json({ success: true, page, limit, total, count: results.length, data: results });
  }

  // Fallback: scan messages (not recommended for large DBs)
  const messages = await Message.find().sort({ createdAt: -1 }).lean();
  const conversationIds = [...new Set(messages.map(m => m.conversationId))].slice(skip, skip + limit);
  const conversations = await Promise.all(conversationIds.map(async (convId) => {
    const latestMessage = await Message.findOne({ conversationId: convId }).sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName email')
      .populate('receiver', 'firstName lastName email');
    const participants = convId.split('_');
    const participantDocs = await User.find({ _id: { $in: participants } }).select('firstName lastName email');
    const messageCount = await Message.countDocuments({ conversationId: convId });
    return {
      conversationId: convId,
      participants: participantDocs,
      latestMessage: {
        message: latestMessage.message,
        createdAt: latestMessage.createdAt
      },
      messageCount
    };
  }));

  res.status(200).json({ success: true, page, limit, count: conversations.length, data: conversations });
});

module.exports = {
  getMessages,
  sendMessage,
  getConversations,
  markAsRead,
  getAllConversations
};
