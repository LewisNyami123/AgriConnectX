const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Approve farmer
// @route   PUT /api/users/approve/:id
// @access  Private/Admin
const approveFarmer = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  if (user.role !== 'farmer') {
    return next(new ErrorResponse('User is not a farmer', 400));
  }

  user.isApproved = true;
  user.idVerification.verified = true;
  user.idVerification.verifiedAt = Date.now();
  user.idVerification.verifiedBy = req.user.id;

  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Upload ID verification
// @route   PUT /api/users/verify-id/:id
// @access  Private/Farmer
const uploadIdVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  if (user._id.toString() !== req.user.id.toString()) {
    return next(new ErrorResponse('Not authorized to update this user', 401));
  }

  // Update ID verification details
  user.idVerification.documentType = req.body.documentType;
  user.idVerification.documentFront = req.body.documentFront;
  user.idVerification.documentBack = req.body.documentBack;
  user.idVerification.verified = false; // Reset verification status

  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get all farmers
// @route   GET /api/users/farmers
// @access  Private/Admin
const getFarmers = asyncHandler(async (req, res, next) => {
  const farmers = await User.find({ role: 'farmer' }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: farmers.length,
    data: farmers
  });
});

// @desc    Get all buyers
// @route   GET /api/users/buyers
// @access  Private/Admin
const getBuyers = asyncHandler(async (req, res, next) => {
  const buyers = await User.find({ role: 'buyer' }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: buyers.length,
    data: buyers
  });
});

module.exports = {  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  approveFarmer,
  uploadIdVerification,
  getFarmers,
  getBuyers}