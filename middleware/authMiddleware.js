const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Validates JWT token from the Authorization header and attaches the authenticated user to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token string after 'Bearer '
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access Denied: Malformed authorization token.'
        });
      }

      // Verify token signature against JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user details from MongoDB (excluding password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Access Denied: The user associated with this token no longer exists.'
        });
      }

      // Attach user document to request object
      req.user = user;
      return next();
    } catch (error) {
      console.error(`[Auth Middleware Error]: ${error.message}`);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access Denied: Token has expired. Please log in again.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Access Denied: Invalid or corrupted token.'
      });
    }
  }

  // If no token was found in headers
  return res.status(401).json({
    success: false,
    message: 'Access Denied: Authorization token missing in request headers.'
  });
};

module.exports = { protect };
