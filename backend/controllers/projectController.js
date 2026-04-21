/**
 * Project Controller
 * Handles project creation, management, and team operations
 */

const { asyncHandler } = require('../middleware/errorMiddleware');
const Project = require('../models/Project');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');

/**
 * Get all projects
 * @route   GET /api/projects
 * @desc    Retrieve all projects with filters and pagination
 * @access  Public
 */
exports.getAllProjects = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  if (search) {
    query = {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ],
    };
  }

  if (category) query.category = category;
  if (status) query.status = status;

  const total = await Project.countDocuments(query);
  const projects = await Project.find(query)
    .limit(limit)
    .skip(skip)
    .populate('creator', 'firstName lastName email profileImage')
    .populate('teamMembers', 'firstName lastName email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: projects,
    pagination: {
      current: page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get projects by user
 * @route   GET /api/projects/user/:userId
 * @desc    Get projects created by a specific user
 * @access  Public
 */
exports.getProjectsByUser = asyncHandler(async (req, res, next) => {
  const projects = await Project.find({ creator: req.params.userId })
    .populate('creator', 'firstName lastName email profileImage')
    .populate('teamMembers', 'firstName lastName email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: projects,
  });
});

/**
 * Get single project
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Public
 */
exports.getProjectById = asyncHandler(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('creator', 'firstName lastName email profileImage')
    .populate('teamMembers', 'firstName lastName email');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  res.status(200).json({
    success: true,
    data: project,
  });
});

/**
 * Create project
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
exports.createProject = asyncHandler(async (req, res, next) => {
  const { title, description, category, status, requiredSkills, teamSize, github, documentation } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title and description',
    });
  }

  const project = await Project.create({
    title,
    description,
    category: category || 'Other',
    status: status || 'planning',
    requiredSkills,
    teamSize,
    github,
    documentation,
    creator: req.user._id,
    teamMembers: [req.user._id],
  });

  // Add project to user's createdProjects
  await User.findByIdAndUpdate(req.user._id, {
    $push: { createdProjects: project._id, joinedProjects: project._id },
  });

  await project.populate('creator', 'firstName lastName email profileImage');

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: project,
  });
});

/**
 * Update project
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private
 */
exports.updateProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Verify user is project creator or admin
  if (project.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this project',
    });
  }

  const allowedFields = [
    'title',
    'description',
    'category',
    'status',
    'requiredSkills',
    'teamSize',
    'endDate',
    'github',
    'documentation',
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedProject = await Project.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('creator', 'firstName lastName email profileImage')
    .populate('teamMembers', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: updatedProject,
  });
});

/**
 * Delete project
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private
 */
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Verify user is project creator or admin
  if (project.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this project',
    });
  }

  // Delete join requests for this project
  await JoinRequest.deleteMany({ project: project._id });

  // Remove project from all users
  await User.updateMany(
    { $or: [{ createdProjects: project._id }, { joinedProjects: project._id }] },
    { $pull: { createdProjects: project._id, joinedProjects: project._id } }
  );

  await Project.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
});

/**
 * Add team member
 * @route   POST /api/projects/:id/members
 * @desc    Add a user to project team
 * @access  Private
 */
exports.addTeamMember = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide user ID',
    });
  }

  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Verify user is project creator
  if (project.creator.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only project creator can add team members',
    });
  }

  // Check if user already in team
  if (project.teamMembers.includes(userId)) {
    return res.status(400).json({
      success: false,
      message: 'User is already a team member',
    });
  }

  // Add user to team
  await Project.findByIdAndUpdate(req.params.id, {
    $push: { teamMembers: userId },
  });

  // Add project to user's joinedProjects
  await User.findByIdAndUpdate(userId, {
    $push: { joinedProjects: req.params.id },
  });

  // Remove any pending join request
  await JoinRequest.deleteOne({ project: req.params.id, requester: userId });

  const updatedProject = await Project.findById(req.params.id)
    .populate('creator', 'firstName lastName email profileImage')
    .populate('teamMembers', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Team member added successfully',
    data: updatedProject,
  });
});
