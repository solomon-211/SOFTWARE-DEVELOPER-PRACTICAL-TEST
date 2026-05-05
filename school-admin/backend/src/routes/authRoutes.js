const express = require('express');
const { body } = require('express-validator');
const { loginAdmin, createStaffMember, getMe } = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  loginAdmin
);

// Create staff (admin only)
router.post(
  '/staff',
  protect,
  adminOnly,
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['admin', 'teacher']),
  ],
  validate,
  createStaffMember
);

router.get('/me', protect, getMe);

module.exports = router;
