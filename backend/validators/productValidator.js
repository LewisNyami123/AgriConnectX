// validators/productValidators.js
const { body, param, query } = require('express-validator');

const createProduct = [
  body('title').exists().isString().isLength({ min: 3, max: 200 }).trim(),
  body('description').exists().isString().isLength({ min: 10 }).trim(),
  body('category').exists().isString(),
  body('price').exists().isFloat({ min: 0 }).toFloat(),
  body('quantity').optional().isInt({ min: 0 }).toInt(),
  body('currency').optional().isString().isLength({ min: 3, max: 5 }),
  body('images').optional().isArray(),
  body('location').optional().isObject()
];

const updateProduct = [
  param('id').isMongoId(),
  body('title').optional().isString().isLength({ min: 3, max: 200 }).trim(),
  body('description').optional().isString().isLength({ min: 3 }).trim(),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('quantity').optional().isInt({ min: 0 }).toInt(),
  body('isActive').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
];

const pagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
];

module.exports = { createProduct, updateProduct, pagination };
