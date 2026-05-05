const express = require('express');
const { body, param } = require('express-validator');
const { getFeeInfo, deposit, withdraw } = require('../controllers/feeController');
const { protect, requireVerifiedDevice } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

// All fee routes require authentication and a verified device
router.use(protect, requireVerifiedDevice);

/**
 * @swagger
 * /api/fees/{studentId}:
 *   get:
 *     summary: Get fee balance and transaction history
 *     tags: [Fees]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the student
 *     responses:
 *       200:
 *         description: Fee balance and last 50 transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:      { type: number, description: Current fee balance in RWF }
 *                     transactions: { type: array, items: { $ref: '#/components/schemas/FeeTransaction' } }
 *       403:
 *         description: Device not verified
 *       404:
 *         description: Student not found
 */
router.get('/:studentId',
  [param('studentId').isMongoId().withMessage('Invalid student ID')],
  validate, getFeeInfo);

/**
 * @swagger
 * /api/fees/{studentId}/deposit:
 *   post:
 *     summary: Submit a fee payment with proof
 *     description: |
 *       Payment proof is required (bank receipt, mobile money screenshot, or link).
 *       Transaction is created with status "pending" until admin verifies the proof.
 *       Balance is updated only after admin approval.
 *     tags: [Fees]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeeDeposit'
 *     responses:
 *       201:
 *         description: Payment submitted — awaiting admin verification
 *       400:
 *         description: Proof required or invalid amount
 *       403:
 *         description: Device not verified
 */
router.post('/:studentId/deposit',
  [
    param('studentId').isMongoId().withMessage('Invalid student ID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('description').optional().trim().isLength({ max: 200 }),
    body('proof').notEmpty().withMessage('Payment proof is required'),
    body('proof.type').isIn(['link', 'file']).withMessage('Proof type must be link or file'),
    body('proof.value').notEmpty().withMessage('Proof value (URL or file data) is required'),
  ],
  validate, deposit);

/**
 * @swagger
 * /api/fees/{studentId}/withdraw:
 *   post:
 *     summary: Submit a refund request
 *     description: |
 *       Creates a pending withdrawal. Admin must approve before balance is deducted.
 *       Will fail if requested amount exceeds current balance.
 *     tags: [Fees]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, description]
 *             properties:
 *               amount:      { type: number, minimum: 0.01 }
 *               description: { type: string, description: Reason for refund }
 *     responses:
 *       201:
 *         description: Refund request submitted — awaiting admin approval
 *       400:
 *         description: Insufficient balance
 *       403:
 *         description: Device not verified
 */
router.post('/:studentId/withdraw',
  [
    param('studentId').isMongoId().withMessage('Invalid student ID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('description').optional().trim().isLength({ max: 200 }),
  ],
  validate, withdraw);

module.exports = router;
