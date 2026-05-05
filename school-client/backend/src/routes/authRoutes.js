const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('deviceId').trim().notEmpty().withMessage('Device ID is required'),
    body('role').optional().isIn(['student', 'parent']).withMessage('Invalid role'),
  ],
  validate,
  registerUser
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('deviceId').trim().notEmpty().withMessage('Device ID is required'),
  ],
  validate,
  loginUser
);

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

module.exports = router;
