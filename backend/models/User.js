/**
 * User Model
 * Stores user profile information and authentication data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    // Personal Information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name must be less than 50 characters'],
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name must be less than 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    phone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
      default: '',
    },

    // Authentication
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },

    // Profile Information
    bio: {
      type: String,
      maxlength: [500, 'Bio must be less than 500 characters'],
      default: '',
    },

    profileImage: {
      type: String,
      default: 'https://via.placeholder.com/150?text=Profile',
    },

    // Skills (for connecting with relevant projects)
    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    // Professional Information
    institution: {
      type: String,
      default: '',
      maxlength: [100, 'Institution must be less than 100 characters'],
    },

    degree: {
      type: String,
      default: '',
      maxlength: [50, 'Degree must be less than 50 characters'],
    },

    major: {
      type: String,
      default: '',
      maxlength: [50, 'Major must be less than 50 characters'],
    },

    // Social Links
    socialLinks: {
      github: {
        type: String,
        default: '',
      },
      linkedin: {
        type: String,
        default: '',
      },
      portfolio: {
        type: String,
        default: '',
      },
    },

    // User Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // User Role
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },

    // Relationships
    createdProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],

    joinedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],

    registeredEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],

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

// Index for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to match user password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get user public profile
UserSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', UserSchema);
