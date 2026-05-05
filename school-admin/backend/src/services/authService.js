/**
 * ============================================================================
 * AUTHENTICATION SERVICE - ADMIN
 * ============================================================================
 * 
 * Handles authentication logic for admin staff:
 * - Login verification
 * - Staff account creation
 * - JWT token generation
 * 
 * Security Notes:
 * - Passwords hashed using SHA-512 (in AdminUser model)
 * - Tokens expire after configured time (default 8 hours)
 * - Error messages generic to prevent user enumeration
 */

const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

/**
 * Generate JWT authentication token
 * 
 * Token contains:
 * - User ID (id): For identifying the authenticated user
 * - Role: For authorization checks (admin or teacher)
 * - Expiry: Tokens expire after 8 hours (configurable)
 * 
 * Token should be included in API requests as:
 * Authorization: Bearer {token}
 * 
 * @static
 * @param {Object} user - AdminUser document with _id and role
 * @returns {string} JWT token signed with JWT_SECRET
 * 
 * @example
 * const user = await AdminUser.findById(id);
 * const token = generateToken(user);
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
const generateToken = (user) =>
  jwt.sign(
    { 
      id: user._id,           // User ID for lookup
      role: user.role         // User role (admin or teacher)
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'  // Default 8 hour expiry
    }
  );

/**
 * Authenticate admin or teacher account
 * 
 * Login workflow:
 * 1. Find user by email (case-insensitive via schema)
 * 2. Verify user account exists and is active
 * 3. Verify password using SHA-512 hash comparison
 * 4. Generate JWT token
 * 5. Return user object and token
 * 
 * Error handling:
 * - Invalid credentials: Generic message (prevents user enumeration)
 * - Inactive account: Cannot login even with correct password
 * 
 * @static
 * @param {Object} params - Login credentials
 * @param {string} params.email - User email address
 * @param {string} params.password - Plain-text password
 * @returns {Promise<Object>} { user: AdminUser, token: string }
 * @throws {Error} Error code 401 if email/password invalid
 * 
 * @example
 * try {
 *   const { user, token } = await login({ 
 *     email: 'admin@school.com', 
 *     password: 'SecurePass123' 
 *   });
 *   // Store token in local storage / session
 *   localStorage.setItem('authToken', token);
 * } catch (err) {
 *   // err.statusCode = 401
 *   // err.message = 'Invalid credentials'
 * }
 */
const login = async ({ email, password }) => {
  // Find user by email
  const user = await AdminUser.findOne({ email });
  
  // Check if user exists and is active
  // Use generic error message to prevent user enumeration attacks
  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  // Verify password using model method (SHA-512 hash comparison)
  if (!user.verifyPassword(password)) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  // Generate token and return authenticated user
  const token = generateToken(user);
  return { user, token };
};

/**
 * Create a new staff account (admin only)
 * 
 * Staff creation workflow:
 * 1. Check if email already exists (prevent duplicates)
 * 2. Hash password using SHA-512
 * 3. Create AdminUser with provided data
 * 4. Return created user document
 * 
 * Validation:
 * - Email must be unique
 * - Role must be 'admin' or 'teacher'
 * - Password strength validated by controller
 * 
 * @static
 * @param {Object} params - Staff account data
 * @param {string} params.firstName - First name
 * @param {string} params.lastName - Last name
 * @param {string} params.email - Email address (unique)
 * @param {string} params.password - Plain-text password (hashed before storage)
 * @param {string} params.role - Role: 'admin' or 'teacher'
 * @returns {Promise<AdminUser>} Created user document
 * @throws {Error} Error code 409 if email already exists
 * 
 * @example
 * try {
 *   const newStaff = await createStaff({
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@school.com',
 *     password: 'SecurePass123',
 *     role: 'teacher'
 *   });
 * } catch (err) {
 *   // err.statusCode = 409
 *   // err.message = 'Email already registered'
 * }
 */
const createStaff = async ({ firstName, lastName, email, password, role }) => {
  // Check if email already exists
  const existing = await AdminUser.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  // Hash password using AdminUser static method (SHA-512)
  const passwordHash = AdminUser.hashPassword(password);
  
  // Create new admin/teacher account
  const user = await AdminUser.create({ 
    firstName, 
    lastName, 
    email, 
    passwordHash, 
    role 
  });
  
  return user;
};

module.exports = { login, createStaff, generateToken };
