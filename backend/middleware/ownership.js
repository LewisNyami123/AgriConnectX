// middleware/ownership.js
const ErrorResponse = require('../utils/errorResponse');

exports.ensureOwnerOrAdmin = (getResourceUserId = (req) => req.params.id) => {
  return (req, res, next) => {
    const resourceUserId = typeof getResourceUserId === 'function' ? getResourceUserId(req) : getResourceUserId;
    if (req.user.role === 'admin') return next();
    if (!req.user || !req.user.id) return next(new ErrorResponse('Not authorized', 401));
    if (req.user.id.toString() !== resourceUserId.toString()) {
      return next(new ErrorResponse('Not authorized: owner only', 403));
    }
    next();
  };
};