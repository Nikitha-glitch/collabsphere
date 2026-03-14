/**
 * Event Model
 * Stores event information and registrations
 */

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    // Event Details
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Event title must be less than 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [2000, 'Event description must be less than 2000 characters'],
    },

    eventType: {
      type: String,
      enum: ['webinar', 'workshop', 'hackathon', 'conference', 'meetup', 'other'],
      default: 'meetup',
    },

    category: {
      type: String,
      enum: [
        'Web Development',
        'Mobile Development',
        'Data Science',
        'Machine Learning',
        'AI',
        'DevOps',
        'Cloud',
        'IoT',
        'Blockchain',
        'Career',
        'Other',
      ],
      default: 'Other',
    },

    // Event Timing
    startDate: {
      type: Date,
      required: [true, 'Event start date is required'],
    },

    endDate: {
      type: Date,
      required: [true, 'Event end date is required'],
    },

    timezone: {
      type: String,
      default: 'UTC',
    },

    // Event Location
    isOnline: {
      type: Boolean,
      default: true,
    },

    location: {
      type: String,
      default: '',
    },

    meetingLink: {
      type: String,
      default: '',
    },

    // Event Information
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    capacity: {
      type: Number,
      default: 100,
      min: [1, 'Capacity must be at least 1'],
    },

    image: {
      type: String,
      default: 'https://via.placeholder.com/400x300?text=Event',
    },

    // Registration
    registrationDeadline: {
      type: Date,
      required: true,
    },

    registrationOpen: {
      type: Boolean,
      default: true,
    },

    registeredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Event Status
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },

    // Additional Info
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    agenda: [
      {
        time: String,
        activity: String,
      },
    ],

    speakers: [
      {
        name: String,
        title: String,
        bio: String,
        image: String,
      },
    ],

    // Engagement
    views: {
      type: Number,
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

// Index for efficient queries
EventSchema.index({ organizer: 1, createdAt: -1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ category: 1 });

module.exports = mongoose.model('Event', EventSchema);
