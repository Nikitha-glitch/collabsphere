/**
 * Chat Log Model
 * Stores conversation history with the AI chatbot
 */

const mongoose = require('mongoose');

const ChatLogSchema = new mongoose.Schema(
  {
    // Reference to user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Allow anonymous chats
    },

    // Session tracking
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    // Chat message
    userMessage: {
      type: String,
      required: [true, 'User message is required'],
    },

    botResponse: {
      type: String,
      default: '',
    },

    // Message metadata
    messageType: {
      type: String,
      enum: ['question', 'greeting', 'navigation', 'other'],
      default: 'question',
    },

    // Response quality
    isHelpful: {
      type: Boolean,
      default: null,
    },

    feedback: {
      type: String,
      maxlength: [500, 'Feedback must be less than 500 characters'],
      default: '',
    },

    // Processing info
    processingTime: {
      type: Number, // in milliseconds
      default: 0,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of chat logs
ChatLogSchema.index({ user: 1, createdAt: -1 });
ChatLogSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatLog', ChatLogSchema);
