// validators/userValidators.js
const { body, param, query } = require('express-validator');

const updateUser = [
  // Only allow these fields in the body; controller will pick them server-side
  body('firstName').optional().isString().isLength({ min: 1, max: 50 }).trim(),
  body('lastName').optional().isString().isLength({ min: 1, max: 50 }).trim(),
  body('phone').optional().isString().isLength({ min: 6, max: 20 }).trim(),
  body('profilePicture').optional().isURL().withMessage('profilePicture must be a valid URL'),
  body('farmName').optional().isString().isLength({ max: 100 }).trim(),
  body('farmLocation').optional().isObject().withMessage('farmLocation must be an object'),
  // Admin-only fields should be validated but controller must enforce admin role
  body('role').optional().isIn(['admin', 'farmer', 'buyer']).withMessage('Invalid role'),
  body('isApproved').optional().isBoolean(),
  body('isActive').optional().isBoolean()
];

const uploadIdVerification = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('documentType').exists().isString().isLength({ min: 2, max: 50 }).trim(),
  body('documentFront').exists().isURL().withMessage('documentFront must be a valid URL'),
  body('documentBack').optional().isURL().withMessage('documentBack must be a valid URL')
];

const pagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

module.exports = {
  updateUser,
  uploadIdVerification,
  pagination
};