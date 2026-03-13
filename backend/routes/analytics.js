const express = require("express");
const router = express.Router();
const Escrow = require("../models/Escrow");
const Logistics = require("../models/Logistics");
const Dispute = require("../models/Dispute");
const {
  getUserAnalytics,
  getAdminAnalytics,
  getProductAnalytics
} = require("../controllers/analyticsController");

const { protect, authorize } = require("../middleware/auth");

// User analytics (authenticated users)
router.get("/user", protect, getUserAnalytics);

// Product analytics (farmers only)
router.get("/products", protect, authorize("farmer"), getProductAnalytics);

// Admin analytics
router.get("/admin", protect, authorize("admin"), getAdminAnalytics);

// Escrow list (admin only)
router.get("/escrow", protect, authorize("admin"), async (req, res) => {
  try {
    const escrows = await Escrow.find()
      .populate("transaction")
      .populate("buyer", "firstName email")
      .populate("farmer", "firstName email");

    res.json({ success: true, data: escrows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Logistics list (admin only)
router.get("/logistics", protect, authorize("admin"), async (req, res) => {
  try {
    const logistics = await Logistics.find().populate("transaction");
    res.json({ success: true, data: logistics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Disputes list (admin only)
router.get("/disputes", protect, authorize("admin"), async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate("transaction")
      .populate("openedBy", "firstName email");

    res.json({ success: true, data: disputes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Example escrow release route
// router.post("/admin/escrow/release/:id", protect, authorize("admin"), async (req, res) => {
//   const escrow = await Escrow.findById(req.params.id);
//   escrow.status = "released";
//   await escrow.save();
//   res.json({ success: true });
// });

module.exports = router;