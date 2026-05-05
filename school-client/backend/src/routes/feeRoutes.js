const express = require('express');
const { body, param } = require('express-validator');
const { getFeeInfo, deposit, withdraw } = require('../controllers/feeController');
const { protect, requireVerifiedDevice } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

// All fee routes require authentication and a verified device
router.use(protect, requireVerifiedDevice);

// GET /api/fees/:studentId
router.get(
  '/:studentId',
  [param('studentId').isMongoId().withMessage('Invalid student ID')],
  validate,
  getFeeInfo
);

// POST /api/fees/:studentId/deposit
router.post(
  '/:studentId/deposit',
  [
    param('studentId').isMongoId().withMessage('Invalid student ID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('description').optional().trim().isLength({ max: 200 }),
    body('proof').notEmpty().withMessage('Payment proof is required'),
    body('proof.type').isIn(['link', 'file']).withMessage('Proof type must be link or file'),
    body('proof.value').notEmpty().withMessage('Proof value (URL or file data) is required'),
  ],
  validate,
  deposit
);

// POST /api/fees/:studentId/withdraw
router.post(
  '/:studentId/withdraw',
  [
    param('studentId').isMongoId().withMessage('Invalid student ID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('description').optional().trim().isLength({ max: 200 }),
  ],
  validate,
  withdraw
);

module.exports = router;
