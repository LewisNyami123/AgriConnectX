// controllers/authController.js
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Access token
function createAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });
}

// Refresh token
function createRefreshToken(user) {
  return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRE || '30d'
  });
}

function sendTokenResponse(user, statusCode, res) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePicture: user.profilePicture || '',
      farmName: user.farmName || '',
      farmLocation: user.farmLocation || null,
      isApproved: user.isApproved
    }
  });
}

// Register
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone, role, farmName, farmLocation } = req.body;

  if (!firstName || !lastName || !email || !password || !phone) {
    return next(new ErrorResponse('Missing required fields', 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new ErrorResponse('Email already registered', 409));

  const user = new User({
    firstName,
    lastName,
    email,
    password, // model pre-save will hash
    phone,
    role: role || 'buyer',
    farmName,
    farmLocation,
    isApproved: role === 'farmer' ? false : true
  });

  await user.save();

  if (user.role === 'farmer' && !user.isApproved) {
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending admin approval.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  }

  sendTokenResponse(user, 201, res);
});

// Login
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new ErrorResponse('Please provide email and password', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new ErrorResponse('Invalid credentials', 401));

  if (user.role === 'farmer' && !user.isApproved) {
    return next(new ErrorResponse('Account pending admin approval', 403));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new ErrorResponse('Invalid credentials', 401));

  sendTokenResponse(user, 200, res);
});

// Get current user
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  res.status(200).json({ success: true, data: user });
});

// Update details
const updateDetails = asyncHandler(async (req, res, next) => {
  const allowed = ['firstName', 'lastName', 'phone', 'profilePicture', 'farmName', 'farmLocation'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  if (!user) return next(new ErrorResponse('User not found', 404));
  res.status(200).json({ success: true, data: user });
});

// Update password
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return next(new ErrorResponse('Missing fields', 400));

  const user = await User.findById(req.user.id).select('+password');
  if (!user) return next(new ErrorResponse('User not found', 404));

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return next(new ErrorResponse('Current password incorrect', 401));

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Forgot password scaffold
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ErrorResponse('Email required', 400));

  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ success: true, message: 'If that email exists, a reset link will be sent' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = resetHash;
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  // TODO: send resetToken via SMS or email
  res.status(200).json({ success: true, message: 'Password reset initiated', resetToken });
});

// Refresh token
const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return next(new ErrorResponse('No refresh token', 401));

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new ErrorResponse('Invalid token', 401));
    const accessToken = createAccessToken(user);
    return res.json({ success: true, accessToken });
  } catch (err) {
    return next(new ErrorResponse('Invalid refresh token', 401));
  }
});

// Logout
const logout = asyncHandler(async (req, res, next) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.json({ success: true, message: 'Logged out' });
});

module.exports = {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  refreshToken,
  logout
};