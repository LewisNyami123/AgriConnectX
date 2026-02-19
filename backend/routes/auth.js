// routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  refreshToken,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many attempts, try later' });
const forgotLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many requests' });

const registerValidation = [
  body('firstName').isLength({ min: 1 }).trim(),
  body('lastName').isLength({ min: 1 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').isLength({ min: 6 }).trim()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
];

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.put('/update', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotpassword', forgotLimiter, body('email').isEmail().normalizeEmail(), forgotPassword);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);

module.exports = router;