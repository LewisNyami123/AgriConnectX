const express = require('express');
const router = express.Router();
const { 
  getUserAnalytics, 
  getAdminAnalytics,
  getProductAnalytics
} = require('../controllers/analyticsController');
const { protect, admin, farmer, buyer } = require('../middleware/auth');

// Routes for user analytics
router.route('/user')
  .get(protect, getUserAnalytics);

router.route('/products')
  .get(protect, farmer, getProductAnalytics);

// Route for admin analytics
router.route('/admin')
  .get(protect, admin, getAdminAnalytics);

module.exports = router;