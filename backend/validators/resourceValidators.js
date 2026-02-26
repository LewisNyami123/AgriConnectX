// validators/resourceValidators.js
const { body, param, query } = require('express-validator');

const createResource = [
  body('title').exists().isString().isLength({ min: 3, max: 200 }).trim(),
  body('content').exists().isString().isLength({ min: 10 }).trim(),
  body('category').exists().isString(),
  body('tags').optional().isArray(),
  body('resourceType').optional().isIn(['article', 'video', 'guide', 'tip', 'news', 'report']),
  body('media').optional().isArray()
];

const updateResource = [
  param('id').isMongoId(),
  body('title').optional().isString().isLength({ min: 3, max: 200 }).trim(),
  body('content').optional().isString().isLength({ min: 3 }).trim(),
  body('category').optional().isString(),
  body('tags').optional().isArray(),
  body('resourceType').optional().isIn(['article', 'video', 'guide', 'tip', 'news', 'report']),
  body('isPublic').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
];

const commentValidator = [
  param('id').isMongoId(),
  body('comment').exists().isString().isLength({ min: 1, max: 1000 }).trim()
];

const pagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('category').optional().isString(),
  query('q').optional().isString()
];

module.exports = { createResource, updateResource, commentValidator, pagination }; 