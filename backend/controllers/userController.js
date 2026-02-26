const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { ensureOwnerOrAdmin } = require('../middleware/ownership'); // import where used
const mongoose = require('mongoose');

// Helper: remove sensitive fields before sending
function sanitizeUser(userDoc) {
  if (!userDoc) return null;
  const u = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete u.password;
  delete u.__v;
  delete u.resetPasswordToken;
  delete u.resetPasswordExpire;
  return u;
}

// GET /api/users?limit=20&page=1
const getAllUsers = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new ErrorResponse('Not authorized', 403));
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, parseInt(req.query.limit || '25', 10));
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password -resetPasswordToken -resetPasswordExpire'),
    User.countDocuments()
  ]);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    count: users.length,
    data: users
  });
});

// GET /api/users/:id
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpire');
  if (!user) return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  // allow owner or admin to view
  if (req.user.role !== 'admin' && req.user.id !== user.id.toString()) {
    // return limited public view for non-owner (optional)
    const publicView = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      role: user.role,
      isApproved: user.isApproved
    };
    return res.status(200).json({ success: true, data: publicView });
  }
  res.status(200).json({ success: true, data: user });
});

// PUT /api/users/:id  (admin or owner)
const updateUser = asyncHandler(async (req, res, next) => {
  // Only admin or owner allowed
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return next(new ErrorResponse('Not authorized to update this user', 403));
  }

  // Whitelist fields that can be updated
  const allowed = ['firstName', 'lastName', 'phone', 'profilePicture', 'farmName', 'farmLocation'];
  // Admin can update role and isApproved
  if (req.user.role === 'admin') allowed.push('role', 'isApproved', 'isActive');

  const updates = pick(req.body, allowed);

  // Prevent accidental password updates here; use dedicated endpoint
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
  if (!user) return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  res.status(200).json({ success: true, data: user });
});

// DELETE /api/users/:id  (admin only) -> soft delete
const deleteUser = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new ErrorResponse('Not authorized', 403));
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  user.isActive = false;
  user.isArchived = true;
  await user.save();
  res.status(200).json({ success: true, data: {} });
});

// PUT /api/users/approve/:id  (admin)
const approveFarmer = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new ErrorResponse('Not authorized', 403));
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  if (user.role !== 'farmer') return next(new ErrorResponse('User is not a farmer', 400));

  user.isApproved = true;
  user.idVerification = user.idVerification || {};
  user.idVerification.verified = true;
  user.idVerification.verifiedAt = new Date();
  user.idVerification.verifiedBy = req.user.id;

  await user.save();
  res.status(200).json({ success: true, data: sanitizeUser(user) });
});

// PUT /api/users/verify-id/:id  (owner)
const uploadIdVerification = asyncHandler(async (req, res, next) => {
  if (req.user.id !== req.params.id) return next(new ErrorResponse('Not authorized to update this user', 403));
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));

  // Validate expected fields server-side (documentType, documentFront, documentBack)
  const { documentType, documentFront, documentBack } = req.body;
  if (!documentType || !documentFront) {
    return next(new ErrorResponse('documentType and documentFront are required', 400));
  }

  // Save references (these should be URLs returned by your upload service)
  user.idVerification = user.idVerification || {};
  user.idVerification.documentType = documentType;
  user.idVerification.documentFront = documentFront;
  if (documentBack) user.idVerification.documentBack = documentBack;
  user.idVerification.verified = false;
  user.idVerification.submittedAt = new Date();

  await user.save();
  res.status(200).json({ success: true, data: sanitizeUser(user) });
});

// GET /api/users/farmers
const getFarmers = asyncHandler(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, parseInt(req.query.limit || '25', 10));
  const skip = (page - 1) * limit;
  const [farmers, total] = await Promise.all([
    User.find({ role: 'farmer' }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
    User.countDocuments({ role: 'farmer' })
  ]);
  res.status(200).json({ success: true, page, limit, total, count: farmers.length, data: farmers });
});

// GET /api/users/buyers
const getBuyers = asyncHandler(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, parseInt(req.query.limit || '25', 10));
  const skip = (page - 1) * limit;
  const [buyers, total] = await Promise.all([
    User.find({ role: 'buyer' }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
    User.countDocuments({ role: 'buyer' })
  ]);
  res.status(200).json({ success: true, page, limit, total, count: buyers.length, data: buyers });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  approveFarmer,
  uploadIdVerification,
  getFarmers,
  getBuyers
};