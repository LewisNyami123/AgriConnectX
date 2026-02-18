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
const { protect, admin, farmer, buyer } = require('../middleware/auth');

// Requiring admin for all user management routes
router.route('/')
  .get(protect, admin, getAllUsers);

router.route('/farmers')
  .get(protect, admin, getFarmers);

router.route('/buyers')
  .get(protect, admin, getBuyers);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

router.put('/approve/:id', protect, admin, approveFarmer);
router.put('/verify-id/:id', protect, farmer, uploadIdVerification);

module.exports = router;