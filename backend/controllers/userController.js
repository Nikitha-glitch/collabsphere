/**
 * User Controller
 * Handles user profile and account management
 */

const { asyncHandler } = require('../middleware/errorMiddleware');
const User = require('../models/User');

/**
 * Get all users
 * @route   GET /api/users
 * @desc    Retrieve all users with pagination and filtering
 * @access  Public
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, search = '', skills = '' } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  if (search) {
    query = {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };
  }

  if (skills) {
    query.skills = { $in: skills.split(',') };
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      current: page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get user by ID
 * @route   GET /api/users/:id
 * @desc    Get single user profile
 * @access  Public
 */
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('createdProjects')
    .populate('joinedProjects');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Get current user profile
 * @route   GET /api/users/profile/me
 * @desc    Get authenticated user's profile
 * @access  Private
 */
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('createdProjects')
    .populate('joinedProjects');

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Update user profile
 * @route   PUT /api/users/:id
 * @desc    Update user profile information
 * @access  Private
 */
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  
  // Verify user is updating their own profile or is admin
  if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this profile',
    });
  }

  const allowedFields = [
    'firstName',
    'lastName',
    'bio',
    'phone',
    'skills',
    'institution',
    'degree',
    'major',
    'socialLinks',
    'profileImage',
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

/**
 * Delete user account
 * @route   DELETE /api/users/:id
 * @desc    Delete user account and associated data
 * @access  Private
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  // Verify user is deleting their own account or is admin
  if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this account',
    });
  }

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'User account deleted successfully',
  });
});
