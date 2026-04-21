/**
 * Conversation Model
 * Manages conversations between users
 */

const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    // Participants in the conversation
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],

    // Conversation name (for group chats - optional)
    name: {
      type: String,
      trim: true,
    },

    // Conversation description
    description: String,

    // Associated Firebase Project ID (for Project Group Chats)
    projectId: {
      type: String,
      index: true,
      default: null,
    },

    // Is this a group chat or 1-1
    isGroup: {
      type: Boolean,
      default: false,
    },

    // Group avatar (optional)
    avatar: String,

    // Last message for quick preview
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },

    // Last message time
    lastMessageAt: {
      type: Date,
      default: null,
    },

    // Muted by users
    mutedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    // Pinned conversations
    pinnedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    // Archived conversations
    archivedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

    // Unread count per user
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    indexes: [
      { participants: 1 },
      { lastMessageAt: -1 },
      { createdAt: -1 },
    ],
  }
);

module.exports = mongoose.model('Conversation', ConversationSchema);
