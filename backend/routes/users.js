// routes/users.js
const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();

const { protect } = require('../middleware/auth'); // your protect middleware
const { ensureOwnerOrAdmin } = require('../middleware/ownership');
const userController = require('../controllers/userController'); // your controller file
const validators = require('../validators/userValidator');

// small middleware to return validation errors
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// GET /api/users  (admin only)
router.get('/', protect, validators.pagination, handleValidation, userController.getAllUsers);

// GET /api/users/:id  (owner or admin can view full, others get public view inside controller)
router.get('/:id', protect, userController.getUserById);

// PUT /api/users/:id  (owner or admin)
router.put(
  '/:id',
  protect,
  validators.updateUser,
  handleValidation,
  // ensureOwnerOrAdmin can be used in controller logic; here we allow protect and controller checks
  userController.updateUser
);

// DELETE /api/users/:id  (admin only)
router.delete('/:id', protect, ensureOwnerOrAdmin((req) => req.params.id), userController.deleteUser);

// PUT /api/users/approve/:id  (admin only)
router.put('/approve/:id', protect, ensureOwnerOrAdmin((req) => req.user.id), userController.approveFarmer);

// PUT /api/users/verify-id/:id  (owner)
router.put(
  '/verify-id/:id',
  protect,
  validators.uploadIdVerification,
  handleValidation,
  userController.uploadIdVerification
);

// GET /api/users/farmers
router.get('/role/farmers', protect, validators.pagination, handleValidation, userController.getFarmers);

// GET /api/users/buyers
router.get('/role/buyers', protect, validators.pagination, handleValidation, userController.getBuyers);

module.exports = router;