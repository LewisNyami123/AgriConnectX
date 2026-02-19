// routes/analytics.js
const express = require('express');
const router = express.Router();
const {
  getUserAnalytics,
  getAdminAnalytics,
  getProductAnalytics
} = require('../controllers/analyticsController');

const { protect, authorize } = require('../middleware/auth');

// Routes for user analytics (authenticated users)
router.route('/user')
  .get(protect, getUserAnalytics);

// Product analytics for farmers
router.route('/products')
  .get(protect, authorize('farmer'), getProductAnalytics);

// Admin analytics
router.route('/admin')
  .get(protect, authorize('admin'), getAdminAnalytics);

module.exports = router;