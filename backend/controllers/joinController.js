/**
 * Join Controller
 * Handles join requests for projects
 */

const { asyncHandler } = require('../middleware/errorMiddleware');
const JoinRequest = require('../models/JoinRequest');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * Create join request
 * @route   POST /api/join-requests
 * @desc    Create a new request to join a project
 * @access  Private
 */
exports.createJoinRequest = asyncHandler(async (req, res, next) => {
  const { projectId, coverLetter = '', proposedRole = 'Team Member' } = req.body;
  const userId = req.user._id;

  // Validate project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  // Check if user is already a team member
  if (project.teamMembers.includes(userId)) {
    return res.status(400).json({
      success: false,
      message: 'You are already a member of this project',
    });
  }

  // Check if user is project creator
  if (project.creator.toString() === userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You are the creator of this project',
    });
  }

  // Check if join request already exists
  const existingRequest = await JoinRequest.findOne({
    project: projectId,
    requester: userId,
    status: 'pending',
  });

  if (existingRequest) {
    return res.status(400).json({
      success: false,
      message: 'You already have a pending request for this project',
    });
  }

  // Create join request
  const joinRequest = await JoinRequest.create({
    project: projectId,
    requester: userId,
    coverLetter,
    proposedRole,
  });

  // Populate user data
  await joinRequest.populate('requester', 'firstName lastName email');
  await joinRequest.populate('project', 'title');

  res.status(201).json({
    success: true,
    message: 'Join request created successfully',
    data: joinRequest,
  });
});

/**
 * Get join requests
 * @route   GET /api/join-requests
 * @desc    Get join requests for user's projects
 * @access  Private
 */
exports.getJoinRequests = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Get all projects created by user
  const userProjects = await Project.find({ creator: userId });
  const projectIds = userProjects.map(p => p._id);

  if (projectIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      message: 'No projects found',
    });
  }

  // Fetch all pending join requests for those projects
  const joinRequests = await JoinRequest.find({
    project: { $in: projectIds },
    status: 'pending',
  })
    .populate('requester', 'firstName lastName email profileImage')
    .populate('project', 'title');

  res.status(200).json({
    success: true,
    data: joinRequests,
    count: joinRequests.length,
  });
});

/**
 * Respond to join request
 * @route   PUT /api/join-requests/:id
 * @desc    Accept or reject join request
 * @access  Private
 */
exports.respondToJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectionReason = '' } = req.body;
  const userId = req.user._id;

  // Validate status
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be "accepted" or "rejected"',
    });
  }

  // Get join request
  const joinRequest = await JoinRequest.findById(id);
  if (!joinRequest) {
    return res.status(404).json({
      success: false,
      message: 'Join request not found',
    });
  }

  // Check if already responded
  if (joinRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `This request has already been ${joinRequest.status}`,
    });
  }

  // Verify user is project creator
  const project = await Project.findById(joinRequest.project);
  if (project.creator.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only project creator can respond to join requests',
    });
  }

  // Update join request
  joinRequest.status = status;
  joinRequest.respondedAt = Date.now();
  joinRequest.respondedBy = userId;

  if (status === 'rejected') {
    joinRequest.rejectionReason = rejectionReason;
  }

  await joinRequest.save();

  // If accepted, add user to project team
  if (status === 'accepted') {
    await Project.findByIdAndUpdate(joinRequest.project, {
      $addToSet: { teamMembers: joinRequest.requester },
    });

    // Add project to user's joinedProjects
    await User.findByIdAndUpdate(joinRequest.requester, {
      $addToSet: { joinedProjects: joinRequest.project },
    });
  }

  await joinRequest.populate('requester', 'firstName lastName email');
  await joinRequest.populate('project', 'title');

  res.status(200).json({
    success: true,
    message: `Join request ${status} successfully`,
    data: joinRequest,
  });
});

/**
 * Cancel join request
 * @route   DELETE /api/join-requests/:id
 * @desc    Cancel a join request
 * @access  Private
 */
exports.cancelJoinRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Get join request
  const joinRequest = await JoinRequest.findById(id);
  if (!joinRequest) {
    return res.status(404).json({
      success: false,
      message: 'Join request not found',
    });
  }

  // Verify user is request creator or project owner
  const project = await Project.findById(joinRequest.project);

  const isRequester = joinRequest.requester.toString() === userId.toString();
  const isProjectOwner = project.creator.toString() === userId.toString();

  if (!isRequester && !isProjectOwner) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to cancel this request',
    });
  }

  // Delete join request
  await JoinRequest.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Join request cancelled successfully',
  });
});
