const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getMe, refreshToken, logoutUser } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new parent or student account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful — device pending admin verification
 *       409:
 *         description: Email already registered
 *       422:
 *         description: Validation error
 */
router.post('/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('deviceId').trim().notEmpty().withMessage('Device ID is required'),
    body('role').optional().isIn(['student', 'parent']).withMessage('Invalid role'),
    body('inviteToken').optional().isString().trim().isLength({ min: 10 })
      .withMessage('Invite token is invalid'),
  ],
  validate, registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email, password, and device ID
 *     description: |
 *       Requires a verified device. The device ID must be sent in the X-Device-ID header
 *       AND in the request body. Admin must verify the device before login is allowed.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Device not verified — contact admin
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('deviceId').trim().notEmpty().withMessage('Device ID is required'),
  ],
  validate, loginUser);

// Refresh access token using refresh cookie
router.post('/refresh', refreshToken);

// Logout and revoke refresh token
router.post('/logout', logoutUser);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user profile including studentProfile and children IDs
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, getMe);

module.exports = router;
