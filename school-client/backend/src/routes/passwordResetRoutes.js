const express = require('express');
const { body } = require('express-validator');
const { requestReset, resetPassword } = require('../services/passwordResetService');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  async (req, res, next) => {
    try {
      await requestReset(req.body.email);
      res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    } catch (err) { next(err); }
  }
);

router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      await resetPassword(req.body.token, req.body.password);
      res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
