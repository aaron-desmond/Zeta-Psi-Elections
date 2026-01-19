const express = require('express');
const router = express.Router();
const votingController = require('../controllers/votingController');
const { protect } = require('../middleware/auth');

// @route   POST /api/voting/vote
// @desc    Cast a vote
// @access  Private
router.post('/vote', protect, votingController.castVote);

// @route   GET /api/voting/has-voted/:electionId
// @desc    Check if user has voted in an election
// @access  Private
router.get('/has-voted/:electionId', protect, votingController.hasVoted);

// @route   GET /api/voting/my-votes
// @desc    Get user's voting history
// @access  Private
router.get('/my-votes', protect, votingController.getMyVotes);

module.exports = router;