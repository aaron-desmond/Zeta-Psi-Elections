const express = require('express');
const router = express.Router();
const positionsController = require('../controllers/positionsController');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/positions
// @desc    Get all positions
// @access  Public
router.get('/', positionsController.getAllPositions);

// @route   GET /api/positions/:id
// @desc    Get single position
// @access  Public
router.get('/:id', positionsController.getPosition);

// @route   POST /api/positions
// @desc    Create new position
// @access  Private/Admin
router.post('/', protect, admin, positionsController.createPosition);

// @route   PUT /api/positions/:id
// @desc    Update position
// @access  Private/Admin
router.put('/:id', protect, admin, positionsController.updatePosition);

// @route   DELETE /api/positions/:id
// @desc    Delete position
// @access  Private/Admin
router.delete('/:id', protect, admin, positionsController.deletePosition);

module.exports = router;