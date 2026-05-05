/**
 * ============================================================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ============================================================================
 * 
 * Provides middleware functions for:
 * - JWT token verification
 * - Role-based access control (Admin, Teacher)
 * - Internal API key validation for service-to-service communication
 */

const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

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
    const user = await AdminUser.findById(decoded.id).select('-passwordHash');
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
 * Admin Only - Restrict access to admin role only
 * 
 * Should be used after protect() middleware.
 * Checks if req.user.role === 'admin'
 * 
 * @param {Object} req - Express request object (with req.user)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

/**
 * Staff Only - Allow admin or teacher role
 * 
 * Should be used after protect() middleware.
 * Checks if req.user.role is 'admin' or 'teacher'
 * Useful for routes that teachers can access
 * 
 * @param {Object} req - Express request object (with req.user)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const staffOnly = (req, res, next) => {
  if (!['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Staff access required' });
  }
  next();
};

/**
 * API Key Authentication - For internal service-to-service calls
 * 
 * Validates the API key sent in X-API-Key header.
 * Used for endpoints that don't require user authentication.
 * 
 * Header Format: X-API-Key: <API_KEY>
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const apiKeyAuth = (req, res, next) => {
  // Extract API key from header
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ success: false, message: 'Invalid API key' });
  }
  next();
};

module.exports = { protect, adminOnly, staffOnly, apiKeyAuth };
