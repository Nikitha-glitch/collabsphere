/**
 * Messaging Routes
 * Handles user-to-user messaging
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getConversations,
  getMessages,
  sendMessage,
  createOrGetConversation,
  createOrGetProjectConversation,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  searchMessages,
} = require('../controllers/messagingController');

/**
 * @route   GET /api/messages/conversations/:userId
 * @desc    Get all conversations for a user
 * @access  Private
 */
router.get('/conversations/:userId', protect, getConversations);

/**
 * @route   POST /api/messages/conversations
 * @desc    Create or get a conversation
 * @access  Private
 */
router.post('/conversations', protect, createOrGetConversation);

/**
 * @route   POST /api/messages/project/:projectId
 * @desc    Create or get a project group conversation
 * @access  Private
 */
router.post('/project/:projectId', protect, createOrGetProjectConversation);

/**
 * @route   GET /api/messages/:conversationId
 * @desc    Get all messages in a conversation
 * @access  Private
 */
router.get('/:conversationId', protect, getMessages);

/**
 * @route   POST /api/messages
 * @desc    Send a new message
 * @access  Private
 */
router.post('/', protect, sendMessage);

/**
 * @route   PUT /api/messages/:conversationId/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put('/:conversationId/read', protect, markMessagesAsRead);

/**
 * @route   PUT /api/messages/:messageId
 * @desc    Edit a message
 * @access  Private
 */
router.put('/:messageId', protect, editMessage);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', protect, deleteMessage);

/**
 * @route   GET /api/messages/:conversationId/search
 * @desc    Search messages in a conversation
 * @access  Private
 */
router.get('/:conversationId/search', protect, searchMessages);

module.exports = router;
