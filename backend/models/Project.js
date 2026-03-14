/**
 * Project Model
 * Stores project information and team members
 */

const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    // Project Details
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Project title must be less than 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Project description is required'],
      maxlength: [2000, 'Project description must be less than 2000 characters'],
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
        'Other',
      ],
      default: 'Other',
    },

    // Project Status
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'on-hold'],
      default: 'planning',
    },

    // Project Metadata
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],

    teamSize: {
      min: {
        type: Number,
        default: 1,
        min: [1, 'Minimum team size must be at least 1'],
      },
      max: {
        type: Number,
        default: 10,
        min: [1, 'Maximum team size must be at least 1'],
      },
    },

    // Timeline
    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      default: null,
    },

    // Team Management
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Project Resources
    github: {
      type: String,
      default: '',
    },

    documentation: {
      type: String,
      default: '',
    },

    liveLink: {
      type: String,
      default: '',
    },

    image: {
      type: String,
      default: 'https://via.placeholder.com/400x300?text=Project',
    },

    // Engagement
    views: {
      type: Number,
      default: 0,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Additional Info
    isPublic: {
      type: Boolean,
      default: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

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
ProjectSchema.index({ creator: 1, createdAt: -1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Project', ProjectSchema);
