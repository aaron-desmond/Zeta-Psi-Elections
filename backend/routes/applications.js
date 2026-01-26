const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applicationsController');
const { protect, admin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// IMPORTANT: Specific routes must come BEFORE parameterized routes to avoid conflicts

// @route   POST /api/applications/floor-nomination
// @desc    Create a floor nomination (admin only)
// @access  Private/Admin
router.post('/floor-nomination', protect, admin, applicationsController.createFloorNomination);

// @route   GET /api/applications/my-applications
// @desc    Get current user's applications
// @access  Private
router.get('/my-applications', protect, applicationsController.getMyApplications);

// @route   GET /api/applications/position/:positionId
// @desc    Get applications for a specific position
// @access  Public
router.get('/position/:positionId', applicationsController.getApplicationsByPosition);

// @route   GET /api/applications
// @desc    Get all applications
// @access  Public
router.get('/', applicationsController.getAllApplications);

// @route   POST /api/applications
// @desc    Submit application
// @access  Private
router.post('/', protect, upload.single('photo'), applicationsController.submitApplication);

// @route   PUT /api/applications/:id
// @desc    Update application
// @access  Private (own application only)
router.put('/:id', protect, upload.single('photo'), applicationsController.updateApplication);

// @route   DELETE /api/applications/:id
// @desc    Delete application
// @access  Private (own application) or Admin
router.delete('/:id', protect, admin, applicationsController.deleteApplication);

module.exports = router;