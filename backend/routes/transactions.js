// routes/transactions.js
const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();

const { protect } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');
const validators = require('../validators/transactionValidators');

// validation handler
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
}

router.post('/', protect, validators.createTransaction, handleValidation, transactionController.createTransaction);
router.post('/:id/pay/initiate', protect, validators.initiatePayment, handleValidation, transactionController.initiatePayment);

// webhook: no auth, provider verifies signature
router.post('/webhook/payments', express.raw({ type: '*/*' }), transactionController.paymentWebhook);

router.get('/', protect, validators.pagination, handleValidation, transactionController.getAllTransactions);
router.get('/:id', protect, transactionController.getTransactionById);
router.put('/:id', protect, transactionController.updateTransaction);
router.delete('/:id', protect, transactionController.deleteTransaction);

module.exports = router;