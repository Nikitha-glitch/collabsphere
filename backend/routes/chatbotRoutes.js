/**
 * Chatbot Routes
 * Handles chatbot interactions and conversations
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Controllers will be imported here
// const {
//   sendMessage,
//   getChatHistory,
//   deleteChatHistory,
//   submitChatFeedback,
// } = require('../controllers/chatbotController');

/**
 * @route   POST /api/chatbot/message
 * @desc    Send message to chatbot
 * @access  Public (Optional protection for logged-in users)
 */
// router.post('/message', sendMessage);

/**
 * @route   GET /api/chatbot/history/:sessionId
 * @desc    Get chat history for a session
 * @access  Public
 */
// router.get('/history/:sessionId', getChatHistory);

/**
 * @route   DELETE /api/chatbot/history/:sessionId
 * @desc    Delete chat history for a session
 * @access  Public
 */
// router.delete('/history/:sessionId', deleteChatHistory);

/**
 * @route   POST /api/chatbot/feedback
 * @desc    Submit feedback on chatbot response
 * @access  Public
 */
// router.post('/feedback', submitChatFeedback);

module.exports = router;
