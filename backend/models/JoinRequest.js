/**
 * Join Request Model
 * Manages requests from users to join projects
 */

const mongoose = require('mongoose');

const JoinRequestSchema = new mongoose.Schema(
  {
    // References
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },

    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    // Request Details
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },

    coverLetter: {
      type: String,
      maxlength: [1000, 'Cover letter must be less than 1000 characters'],
      default: '',
    },

    proposedRole: {
      type: String,
      default: 'Team Member',
    },

    // Application Info
    appliedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason must be less than 500 characters'],
      default: '',
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

// Unique constraint: User can only request once per project
JoinRequestSchema.index({ project: 1, requester: 1 }, { unique: true });

// Additional indexes for efficient queries
JoinRequestSchema.index({ requester: 1, status: 1 });
JoinRequestSchema.index({ project: 1, status: 1 });
JoinRequestSchema.index({ status: 1 });

module.exports = mongoose.model('JoinRequest', JoinRequestSchema);
