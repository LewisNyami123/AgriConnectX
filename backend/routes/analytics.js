// routes/analytics.js
const express = require('express');
const router = express.Router();
const Escrow = require('../models/Escrow');
const Logistics = require('../models/Logistics');
const Dispute = require('../models/Dispute');
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

  router.get("/escrow", protect, authorize("admin"), async (req, res) => {
  const escrows = await Escrow.find();
  res.json({ success: true, data: escrows });
});

router.get("/logistics", protect, authorize("admin"), async (req, res) => {
  const logistics = await Logistics.find();
  res.json({ success: true, data: logistics });
});

router.get("/disputes", protect, authorize("admin"), async (req, res) => {
  const disputes = await Dispute.find();
  res.json({ success: true, data: disputes });
});


module.exports = router;