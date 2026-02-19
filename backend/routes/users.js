const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  approveFarmer,
  uploadIdVerification,
  getFarmers,
  getBuyers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Admin-only user management
router.route('/')
  .get(protect, authorize('admin'), getAllUsers);

router.route('/farmers')
  .get(protect, authorize('admin'), getFarmers);

router.route('/buyers')
  .get(protect, authorize('admin'), getBuyers);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

router.put('/approve/:id', protect, authorize('admin'), approveFarmer);
router.put('/verify-id/:id', protect, authorize('farmer'), uploadIdVerification);

module.exports = router;