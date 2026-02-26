// validators/transactionValidators.js
const { body, param, query } = require('express-validator');

const productItem = [
  body('products').isArray({ min: 1 }).withMessage('products must be a non-empty array'),
  body('products.*.product').exists().isMongoId().withMessage('product must be a valid id'),
  body('products.*.quantity').exists().isInt({ min: 1 }).withMessage('quantity must be >= 1')
];

const createTransaction = [
  ...productItem,
  body('paymentMethod').optional().isIn(['mtn_momo', 'orange_money', 'bank_transfer', 'cash']).withMessage('Invalid payment method'),
  body('deliveryAddress').optional().isObject().withMessage('deliveryAddress must be an object')
];

const initiatePayment = [
  param('id').isMongoId().withMessage('Invalid transaction id'),
  body('paymentMethod').optional().isIn(['mtn_momo', 'orange_money', 'bank_transfer', 'cash'])
];

const pagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

module.exports = {
  createTransaction,
  initiatePayment,
  pagination
};