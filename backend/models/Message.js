/**
 * Message Model
 * Stores user-to-user messages with code sharing support
 */

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    // Conversation reference
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },

    // Sender reference
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Message content
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },

    // Message type
    messageType: {
      type: String,
      enum: ['text', 'code', 'image', 'file'],
      default: 'text',
    },

    // Code sharing (if messageType is 'code')
    codeData: {
      language: String,        // javascript, python, java, etc.
      code: String,            // Actual code content
      fileName: String,        // Optional file name
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    // Reactions/Emojis
    reactions: [{
      emoji: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],

    // Reply to message (threading)
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true,
    indexes: [
      { conversation: 1, createdAt: -1 },
      { sender: 1, createdAt: -1 },
    ],
  }
);

module.exports = mongoose.model('Message', MessageSchema);
