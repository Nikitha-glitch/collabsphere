/**
 * Project Routes
 * Handles project creation, management, and team joining
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Controllers will be imported here
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByUser,
  addTeamMember,
} = require('../controllers/projectController');

/**
 * @route   GET /api/projects
 * @desc    Get all projects with filters and pagination
 * @access  Public
 */
router.get('/', getAllProjects);

/**
 * @route   GET /api/projects/user/:userId
 * @desc    Get projects created by a specific user
 * @access  Public
 */
router.get('/user/:userId', getProjectsByUser);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Public
 */
router.get('/:id', getProjectById);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/', protect, createProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private
 */
router.put('/:id', protect, updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private
 */
router.delete('/:id', protect, deleteProject);

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add team member to project
 * @access  Private
 */
router.post('/:id/members', protect, addTeamMember);

module.exports = router;
