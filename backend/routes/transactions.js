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
const { protect, admin, farmer, buyer } = require('../middleware/auth');

// All routes require authentication
router.route('/')
  .get(protect, getAllTransactions)
  .post(protect, buyer, createTransaction);

router.route('/user/:userId')
  .get(protect, getUserTransactions);

router.route('/process-payment/:id')
  .post(protect, buyer, processPayment);

router.route('/:id')
  .get(protect, getTransactionById)
  .put(protect, updateTransaction)
  .delete(protect, admin, deleteTransaction);

module.exports = router;