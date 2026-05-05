/**
 * ============================================================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE (CLIENT)
 * ============================================================================
 * 
 * Provides middleware functions for:
 * - JWT token verification for parent/student accounts
 * - Device verification validation
 * - Role-based access control (Student, Parent)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect Route - Verify JWT token validity
 * 
 * Validates the JWT token sent in Authorization header.
 * Attaches verified user to req.user for downstream use.
 * 
 * Header Format: Authorization: Bearer <JWT_TOKEN>
 * 
 * Success: Calls next() to proceed to next middleware/route
 * Failure: Returns 401 with error message
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const protect = async (req, res, next) => {
  try {
    // Extract authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Extract and verify JWT token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database using decoded ID
    // Exclude password hash from response
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    // Attach user to request for use in controllers
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Verify Device - Ensure device is approved by admin
 * 
 * Critical security middleware for client API.
 * 
 * Validates that:
 * 1. X-Device-ID header is present in request
 * 2. Device is registered to the user
 * 3. Device has been verified (approved) by admin
 * 
 * Should be used after protect() middleware.
 * Prevents unauthorized device access even with valid token.
 * 
 * Header Format: X-Device-ID: <DEVICE_ID>
 * 
 * Workflow:
 * - User registers/logs in with deviceId
 * - Device is marked as 'unverified'
 * - Admin reviews and approves device
 * - Only then can user access protected resources
 * - Device remains verified for future logins
 * 
 * @param {Object} req - Express request object (with req.user)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const requireVerifiedDevice = (req, res, next) => {
  // Extract device ID from header
  const deviceId = req.headers['x-device-id'];
  if (!deviceId) {
    return res.status(403).json({ success: false, message: 'Device ID header missing' });
  }

  // Check if device is verified (approved by admin)
  if (!req.user.isDeviceVerified(deviceId)) {
    return res.status(403).json({
      success: false,
      message: 'Device not verified. Please wait for admin approval.',
    });
  }

  // Attach device ID to request for audit logging
  req.deviceId = deviceId;
  next();
};

/**
 * Authorize by Role - Restrict access to specific roles
 * 
 * Higher-order function that creates role-checking middleware.
 * Allows checking for one or more roles.
 * 
 * Usage: router.get('/route', protect, authorize('parent', 'student'), controller);
 * 
 * @param {...string} roles - One or more allowed role names
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => (req, res, next) => {
  // Check if user's role is in the allowed roles list
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

module.exports = { protect, requireVerifiedDevice, authorize };
