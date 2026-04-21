/**
 * Messaging Controller
 * Handles user-to-user messaging with code sharing support
 */

const { asyncHandler } = require('../middleware/errorMiddleware');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

/**
 * Get or create a conversation between two users
 * @route   GET /api/messages/conversations/:userId
 * @desc    Get all conversations for a user
 * @access  Private
 */
exports.getConversations = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate('participants', 'firstName lastName avatar email')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations,
  });
});

/**
 * Get messages from a conversation
 * @route   GET /api/messages/:conversationId
 * @desc    Get all messages in a conversation (paginated)
 * @access  Private
 */
exports.getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'firstName lastName avatar email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Message.countDocuments({ conversation: conversationId });

  res.status(200).json({
    success: true,
    count: messages.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: messages.reverse(),
  });
});

/**
 * Send a message
 * @route   POST /api/messages
 * @desc    Send a new message to a conversation
 * @access  Private
 */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, senderId, content, messageType = 'text', codeData } = req.body;

  if (!conversationId || !senderId || !content) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: conversationId, senderId, content',
    });
  }

  // Verify sender is part of conversation
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found',
    });
  }

  if (!conversation.participants.includes(senderId)) {
    return res.status(403).json({
      success: false,
      message: 'You are not a participant in this conversation',
    });
  }

  // Create message
  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    content,
    messageType,
    codeData: messageType === 'code' ? codeData : undefined,
  });

  // Populate sender info
  await message.populate('sender', 'firstName lastName avatar email');

  // Update conversation with last message
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastMessageAt: new Date(),
  });

  // Emit real-time update via Socket.IO
  const io = req.app.get('io');
  io.emit(`message:new:${conversationId}`, {
    _id: message._id,
    conversation: conversationId,
    sender: message.sender,
    content: message.content,
    messageType: message.messageType,
    codeData: message.codeData,
    createdAt: message.createdAt,
  });

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: message,
  });
});

/**
 * Create or get a conversation between two users
 * @route   POST /api/messages/conversations
 * @desc    Create a new conversation or get existing one
 * @access  Private
 */
exports.createOrGetConversation = asyncHandler(async (req, res) => {
  const { participantIds } = req.body;

  if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'At least 2 participant IDs are required',
    });
  }

  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    participants: { $all: participantIds },
    isGroup: participantIds.length > 2,
    projectId: null, // explicitly ensure it's not a project group chat
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: participantIds,
      isGroup: participantIds.length > 2,
    });
  }

  await conversation.populate('participants', 'firstName lastName avatar email');

  res.status(200).json({
    success: true,
    message: conversation ? 'Conversation found' : 'Conversation created',
    data: conversation,
  });
});

/**
 * Create or get a project conversation group
 * @route   POST /api/messages/project/:projectId
 * @desc    Create a new project group conversation or get existing one
 * @access  Private
 */
exports.createOrGetProjectConversation = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { participantIds, projectName } = req.body;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required',
    });
  }

  // Check if project group conversation already exists
  let conversation = await Conversation.findOne({ projectId });

  if (conversation) {
    // Sync participants if there's any change
    if (participantIds && Array.isArray(participantIds)) {
       // Check if we need to update participants
       const currentIds = conversation.participants.map(p => p.toString());
       const hasChanges = participantIds.some(id => !currentIds.includes(id)) || 
                          currentIds.some(id => !participantIds.includes(id));
       
       if (hasChanges) {
         conversation.participants = participantIds;
         await conversation.save();
       }
    }
  } else {
    // Create new project conversation
    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({
        success: false,
        message: 'Participant IDs are required when creating a new project chat',
      });
    }

    conversation = await Conversation.create({
      participants: participantIds,
      isGroup: true,
      projectId,
      name: projectName || 'Project Group Chat'
    });
  }

  await conversation.populate('participants', 'firstName lastName avatar email');

  res.status(200).json({
    success: true,
    message: conversation ? 'Conversation found' : 'Conversation created',
    data: conversation,
  });
});

/**
 * Mark messages as read
 * @route   PUT /api/messages/:conversationId/read
 * @desc    Mark all messages in conversation as read
 * @access  Private
 */
exports.markMessagesAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { userId } = req.body;

  await Message.updateMany(
    { conversation: conversationId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  // Update unread count
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCount.${userId}`]: 0 },
  });

  res.status(200).json({
    success: true,
    message: 'Messages marked as read',
  });
});

/**
 * Delete a message
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
exports.deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { senderId } = req.body;

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  // Only sender can delete their message
  if (message.sender.toString() !== senderId) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own messages',
    });
  }

  await Message.findByIdAndDelete(messageId);

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully',
  });
});

/**
 * Edit a message
 * @route   PUT /api/messages/:messageId
 * @desc    Edit a message
 * @access  Private
 */
exports.editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { senderId, content } = req.body;

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  // Only sender can edit their message
  if (message.sender.toString() !== senderId) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own messages',
    });
  }

  message.content = content;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  await message.populate('sender', 'firstName lastName avatar email');

  res.status(200).json({
    success: true,
    message: 'Message updated successfully',
    data: message,
  });
});

/**
 * Search messages in a conversation
 * @route   GET /api/messages/:conversationId/search
 * @desc    Search for messages in a conversation
 * @access  Private
 */
exports.searchMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const messages = await Message.find({
    conversation: conversationId,
    content: { $regex: q, $options: 'i' },
  })
    .populate('sender', 'firstName lastName avatar email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages,
  });
});

module.exports = exports;
