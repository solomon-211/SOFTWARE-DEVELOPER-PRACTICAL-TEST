/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER - ADMIN
 * ============================================================================
 * 
 * Handles HTTP requests for authentication.
 * 
 * Responsibilities:
 * - Extract credentials from request body
 * - Call authentication service
 * - Transform response using DTOs
 * - Return JWT token to client
 * - Handle authentication errors
 * 
 * Request Flow:
 * Request → Controller → Service → Model → Controller → DTO → Response
 */

const { login, createStaff } = require('../services/authService');
const { toAdminUser } = require('../dtos/adminDto');

/**
 * Handle admin/teacher login
 * 
 * Route: POST /api/auth/login
 * 
 * Request body:
 * {
 *   "email": "admin@school.com",
 *   "password": "SecurePass123"
 * }
 * 
 * Response on success (200):
 * {
 *   "success": true,
 *   "data": {
 *     "user": { id, firstName, lastName, email, role, ... },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 * 
 * Error responses:
 * - 401: Invalid email or password
 * - 400: Missing required fields
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body with email and password
 * @param {Object} res - Express response object
 * @param {Function} next - Express error handler middleware
 * 
 * @example
 * POST /api/auth/login
 * Content-Type: application/json
 * 
 * {
 *   "email": "teacher@school.com",
 *   "password": "Password123"
 * }
 */
const loginAdmin = async (req, res, next) => {
  try {
    // Call authentication service to verify credentials
    const { user, token } = await login(req.body);
    
    // Transform user data to DTO (remove sensitive fields)
    res.json({ 
      success: true, 
      data: { 
        user: toAdminUser(user),  // Safe user object without passwordHash
        token                      // JWT token for subsequent requests
      } 
    });
  } catch (err) {
    // Pass error to global error handler middleware
    next(err);
  }
};

/**
 * Create new staff account (admin only)
 * 
 * Route: POST /api/auth/staff
 * Middleware: requireAuth, adminOnly
 * 
 * Request body:
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john@school.com",
 *   "password": "SecurePass123",
 *   "role": "teacher"
 * }
 * 
 * Response on success (201 Created):
 * {
 *   "success": true,
 *   "data": { id, firstName, lastName, email, role, ... }
 * }
 * 
 * Error responses:
 * - 409: Email already registered
 * - 400: Invalid data or failed validation
 * - 403: Insufficient permissions (not admin)
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Staff data
 * @param {string} req.body.firstName - First name
 * @param {string} req.body.lastName - Last name
 * @param {string} req.body.email - Email address
 * @param {string} req.body.password - Password
 * @param {string} req.body.role - Role (admin or teacher)
 * @param {Object} res - Express response object
 * @param {Function} next - Express error handler middleware
 * 
 * @example
 * POST /api/auth/staff
 * Authorization: Bearer {token}
 * Content-Type: application/json
 * 
 * {
 *   "firstName": "Jane",
 *   "lastName": "Smith",
 *   "email": "jane@school.com",
 *   "password": "SecurePass123",
 *   "role": "teacher"
 * }
 */
const createStaffMember = async (req, res, next) => {
  try {
    // Call service to create new staff account
    const user = await createStaff(req.body);
    
    // Return created user with 201 Created status
    res.status(201).json({ 
      success: true, 
      data: toAdminUser(user)  // DTO removes sensitive fields
    });
  } catch (err) {
    // Pass error to global error handler middleware
    next(err);
  }
};

/**
 * Get current authenticated user profile
 * 
 * Route: GET /api/auth/me
 * Middleware: requireAuth (JWT validation)
 * 
 * Returns: Current user profile from JWT token
 * No request body needed - user attached to req.user by middleware
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": { id, firstName, lastName, email, role, ... }
 * }
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user (attached by auth middleware)
 * @param {Object} res - Express response object
 * 
 * @example
 * GET /api/auth/me
 * Authorization: Bearer {token}
 */
const getMe = (req, res) => {
  res.json({ 
    success: true, 
    data: toAdminUser(req.user)
  });
};

module.exports = { loginAdmin, createStaffMember, getMe };
