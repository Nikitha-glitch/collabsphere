/**
 * Join Request Routes
 * Handles requests to join projects
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Controllers will be imported here
const {
  createJoinRequest,
  getJoinRequests,
  respondToJoinRequest,
  cancelJoinRequest,
} = require('../controllers/joinController');

/**
 * @route   POST /api/join-requests
 * @desc    Create a new join request
 * @access  Private
 */
router.post('/', protect, createJoinRequest);

/**
 * @route   GET /api/join-requests
 * @desc    Get all join requests (for project creator)
 * @access  Private
 */
router.get('/', protect, getJoinRequests);

/**
 * @route   PUT /api/join-requests/:id
 * @desc    Respond to join request (accept/reject)
 * @access  Private
 */
router.put('/:id', protect, respondToJoinRequest);

/**
 * @route   DELETE /api/join-requests/:id
 * @desc    Cancel a join request
 * @access  Private
 */
router.delete('/:id', protect, cancelJoinRequest);

module.exports = router;
