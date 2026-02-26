// middleware/socketAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

const verifySocketToken = async (token) => {
  if (!token) throw new Error('No token provided');
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  const decoded = jwt.verify(token, secret);
  // decoded should contain user id (e.g., { id: '...', iat, exp })
  if (!decoded || !decoded.id) throw new Error('Invalid token payload');
  const user = await User.findById(decoded.id).select('_id role firstName lastName email isApproved');
  if (!user) throw new Error('User not found');
  return user;
};

// Socket.io middleware for authentication
// Usage: io.use(socketAuthMiddleware);
async function socketAuthMiddleware(socket, next) {
  try {
    // token can be sent in handshake.auth.token or handshake.headers.authorization
    const token = (socket.handshake && (socket.handshake.auth && socket.handshake.auth.token))
      || (socket.handshake && socket.handshake.headers && socket.handshake.headers.authorization && socket.handshake.headers.authorization.split(' ')[1]);

    if (!token) {
      return next(new Error('Authentication error: token required'));
    }

    const user = await verifySocketToken(token);
    // attach minimal user info to socket
    socket.user = {
      id: user._id.toString(),
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isApproved: user.isApproved
    };
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
}

module.exports = { socketAuthMiddleware, verifySocketToken };
