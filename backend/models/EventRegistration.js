/**
 * Event Registration Model
 * Tracks user registrations for events
 */

const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema(
  {
    // References
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    // Registration Details
    registrationStatus: {
      type: String,
      enum: ['registered', 'attended', 'cancelled', 'no-show'],
      default: 'registered',
    },

    registeredAt: {
      type: Date,
      default: Date.now,
    },

    // Attendance tracking
    attendanceConfirmed: {
      type: Boolean,
      default: false,
    },

    attendedAt: {
      type: Date,
      default: null,
    },

    // Additional Info
    notes: {
      type: String,
      maxlength: [500, 'Notes must be less than 500 characters'],
      default: '',
    },

    // Feedback
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        maxlength: [500, 'Feedback must be less than 500 characters'],
        default: '',
      },
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
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

// Unique constraint: User can only register once per event
EventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

// Additional indexes
EventRegistrationSchema.index({ user: 1, createdAt: -1 });
EventRegistrationSchema.index({ event: 1 });
EventRegistrationSchema.index({ registrationStatus: 1 });

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);
