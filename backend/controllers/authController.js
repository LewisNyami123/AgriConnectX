const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const ErrorResponse = require('../utils/errorResponse');


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const User = require('../models/User');

const register = async (req, res) => {
  const { firstName, lastName, email, password, phone, role, farmName, farmLocation } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: role || 'buyer',
      farmName,
      farmLocation,
      isApproved: role === 'farmer' ? false : true
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send response
    res.status(201).json({
      success: true,
      message: role === 'farmer'
        ? 'Registration successful! Pending admin approval.'
        : 'Registration successful!',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        farmName: user.farmName,
        farmLocation: user.farmLocation,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// const register = asyncHandler(async (req, res, next) => {
//   const { firstName, lastName, email, password, phone, role, farmName, farmLocation } = req.body;

//   // Check if user already exists BEFORE creating
//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     return next(new ErrorResponse('Email already registered', 400));
//   }

//   // Create user once
//   const user = await User.create({
//     firstName,
//     lastName,
//     email,
//     password,
//     phone,
//     role: role || 'buyer',
//     farmName,
//     farmLocation,
//     isApproved: role === 'farmer' ? false : true
//   });

//   // Send token + success response
//   sendTokenResponse(user, 201, res);
// });
//const registerUser = async (req, res) => {
  // const { firstName, lastName, email, password, phone, role, farmName, farmLocation } = req.body;

  // try {
  //   const existingUser = await User.findOne({ email });
  //   if (existingUser) {
  //     return res.status(400).json({ message: 'User already exists' });
  //   }

  //   // const hashedPassword = await bcrypt.hash(password, 12);

  //   const user = new User({ 
  //   firstName,
  //   lastName,
  //   email,
  //   password,
  //   phone,
  //   role: role || 'buyer',
  //   farmName,
  //   farmLocation,
  //   isApproved: role === 'farmer' ? false : true });
  //   await user.save();

  //   // Generate token immediately
  //   const token = jwt.sign({ id: user._id, role: user.role, level: user.level }, process.env.JWT_SECRET, { expiresIn: '1h' });

  //   res.status(201).json({
  //     token,
  //     user: { id: user._id, name: user.name, role: user.role, level: user.level }
  //   });
  // } catch (err) {
  //   console.error("Register error:", err);
  //   res.status(500).json({ message: err.message });
  // }
//};//

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new ErrorResponse('Invalid credentials', 401));

  if (user.role === 'farmer' && !user.isApproved) {
    return next(new ErrorResponse('Account pending admin approval', 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new ErrorResponse('Invalid credentials', 401));

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorResponse('User not found', 404));

  res.status(200).json({ success: true, data: user });
});

// @desc    Update user details
// @route   PUT /api/auth/update
// @access  Private
const updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = { ...req.body };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  if (!user) return next(new ErrorResponse('User not found', 404));

  res.status(200).json({ success: true, data: user });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return next(new ErrorResponse('User not found', 404));

  const isMatch = await user.comparePassword(req.body.currentPassword);
  if (!isMatch) return next(new ErrorResponse('Password is incorrect', 401));

  user.password = req.body.newPassword;
  await user.save(); // relies on pre-save hook for hashing

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  return next(new ErrorResponse('Forgot password not implemented yet', 501));
});

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + Number(process.env.JWT_EXPIRE) * 24 * 60 * 60 * 1000), // days
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePicture: user.profilePicture,
      farmName: user.farmName,
      farmLocation: user.farmLocation,
      isApproved: user.isApproved
    }
  });
};

module.exports = { register, login, getMe, updateDetails, updatePassword, forgotPassword };