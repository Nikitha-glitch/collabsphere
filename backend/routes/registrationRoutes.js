/**
 * Event Registration Routes
 * Handles event registration management
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Controllers will be imported here
// const {
//   getMyRegistrations,
//   cancelRegistration,
//   getEventRegistrations,
//   submitFeedback,
// } = require('../controllers/registrationController');

/**
 * @route   GET /api/registrations/my
 * @desc    Get current user's event registrations
 * @access  Private
 */
// router.get('/my', protect, getMyRegistrations);

/**
 * @route   DELETE /api/registrations/:id
 * @desc    Cancel event registration
 * @access  Private
 */
// router.delete('/:id', protect, cancelRegistration);

/**
 * @route   GET /api/registrations/event/:eventId
 * @desc    Get registrations for a specific event
 * @access  Private
 */
// router.get('/event/:eventId', protect, getEventRegistrations);

/**
 * @route   POST /api/registrations/:id/feedback
 * @desc    Submit feedback for attended event
 * @access  Private
 */
// router.post('/:id/feedback', protect, submitFeedback);

module.exports = router;
