// routes/transactions.js
const express = require('express');
const router = express.Router();
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getUserTransactions,
  processPayment
} = require('../controllers/transactionController');

const { protect, authorize } = require('../middleware/auth');

// Admin can list all transactions
router.route('/')
  .get(protect, authorize('admin'), getAllTransactions)
  .post(protect, authorize('buyer'), createTransaction);

// Transactions for a specific user
router.route('/user/:userId')
  .get(protect, getUserTransactions);

// Process payment for a transaction (buyer)
router.route('/process-payment/:id')
  .post(protect, authorize('buyer'), processPayment);

// Single transaction operations
router.route('/:id')
  .get(protect, getTransactionById)
  .put(protect, updateTransaction) // consider owner check inside controller or middleware
  .delete(protect, authorize('admin'), deleteTransaction);

module.exports = router;