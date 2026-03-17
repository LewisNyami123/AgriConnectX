const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Escrow = require("../models/Escrow");
const Logistics = require("../models/Logistics");
const Dispute = require("../models/Dispute");
const {
  getUserAnalytics,
  getAdminAnalytics,
  getProductAnalytics
} = require("../controllers/analyticsController");

const { protect, authorize } = require("../middleware/auth");

/* ======================================================
USER ANALYTICS
====================================================== */
router.get("/user", protect, getUserAnalytics);

/* ======================================================
PRODUCT ANALYTICS (farmers only)
====================================================== */
router.get("/products", protect, authorize("farmer"), getProductAnalytics);

/* ======================================================
ADMIN ANALYTICS
====================================================== */
router.get("/admin", protect, authorize("admin"), getAdminAnalytics);

/* ======================================================
ESCROW LIST (admin only)
====================================================== */
router.get("/escrow", protect, authorize("admin"), async (req, res) => {
  try {
    const escrows = await Escrow.find()
      .populate("transaction")
      .populate("buyer", "firstName email")
      .populate("farmer", "firstName email");

    res.json({ success: true, data: escrows });
  } catch (err) {
    console.error("Escrow error:", err.stack);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ======================================================
LOGISTICS LIST (admin only)
====================================================== */
router.get("/logistics", protect, authorize("admin"), async (req, res) => {
  try {
    const logistics = await Logistics.find().populate("transaction");
    res.json({ success: true, data: logistics });
  } catch (err) {
    console.error("Logistics error:", err.stack);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ======================================================
DISPUTES LIST (admin only)
====================================================== */
router.get("/disputes", protect, authorize("admin"), async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate("transaction")
      .populate("openedBy", "firstName email");

    res.json({ success: true, data: disputes });
  } catch (err) {
    console.error("Disputes error:", err.stack);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ======================================================
ADMIN APPROVE FARMER
====================================================== */
router.post("/admin/approve/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Farmer approved successfully", data: user });
  } catch (err) {
    console.error("Approve error:", err.stack);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ======================================================
ADMIN REJECT FARMER
====================================================== */
router.post("/admin/reject/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: false },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Farmer rejected", data: user });
  } catch (err) {
    console.error("Reject error:", err.stack);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ======================================================
GET ALL USERS (ADMIN)
====================================================== */
router.get("/admin/users", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error("Users error:", err.stack);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ======================================================
DELETE USER (ADMIN)
====================================================== */
router.delete("/admin/users/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("Delete error:", err.stack);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;