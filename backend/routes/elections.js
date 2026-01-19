const express = require('express');
const router = express.Router();
const electionsController = require('../controllers/electionsController');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/elections
// @desc    Get all elections
// @access  Public
router.get('/', electionsController.getAllElections);

// @route   GET /api/elections/active
// @desc    Get active elections
// @access  Public
router.get('/active', electionsController.getActiveElections);

// @route   GET /api/elections/:id/results
// @desc    Get election results
// @access  Public
router.get('/:id/results', electionsController.getElectionResults);

// @route   POST /api/elections/start
// @desc    Start a new election
// @access  Private/Admin
router.post('/start', protect, admin, electionsController.startElection);

// @route   PUT /api/elections/:id/end
// @desc    End an election
// @access  Private/Admin
router.put('/:id/end', protect, admin, electionsController.endElection);

// @route   PUT /api/elections/:id/next-round
// @desc    Start next round of multi-seat election
// @access  Private/Admin
router.put('/:id/next-round', protect, admin, electionsController.startNextRound);

// @route   DELETE /api/elections/reset
// @desc    Reset all elections
// @access  Private/Admin
router.delete('/reset', protect, admin, electionsController.resetAllElections);

module.exports = router;