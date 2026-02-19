// middleware/auth.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

const protect = asyncHandler(async (req, res, next) => {
 // Temporary debug logs — remove after debugging
  console.log('--- protect middleware ---');
  console.log('Authorization header:', req.headers.authorization);
  console.log('Cookies:', req.cookies ? Object.keys(req.cookies).reduce((o,k)=>{o[k]=req.cookies[k];return o},{}) : req.cookies);
  console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);

  let token;

  // 1) Authorization header (Bearer)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2) Fallback to common cookie names (useful for testing)
  if (!token) {
    token = req.cookies?.accessToken || req.cookies?.token || req.cookies?.refreshToken;
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized: no token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new ErrorResponse('Not authorized: user not found', 401));
    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return next(new ErrorResponse('Not authorized: token invalid', 401));
  }
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new ErrorResponse('Forbidden', 403));
  next();
};
module.exports = { protect, authorize };
