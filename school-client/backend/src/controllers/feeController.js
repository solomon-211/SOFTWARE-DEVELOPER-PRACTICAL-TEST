const feeService = require('../services/feeService');

/**
 * GET /api/fees/:studentId
 * Get fee balance and transaction history for a student.
 */
const getFeeInfo = async (req, res, next) => {
  try {
    const data = await feeService.getFeeInfo(req.params.studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/fees/:studentId/deposit
 * Make a fee payment (deposit).
 */
const deposit = async (req, res, next) => {
  try {
    const { amount, description, proof } = req.body;
    const tx = await feeService.deposit(
      req.params.studentId,
      Number(amount),
      description,
      proof,
      req.user._id
    );
    res.status(201).json({ success: true, message: 'Payment submitted. Awaiting admin verification.', data: tx });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/fees/:studentId/withdraw
 * Submit a refund request (withdrawal).
 */
const withdraw = async (req, res, next) => {
  try {
    const { amount, description } = req.body;
    const tx = await feeService.withdraw(
      req.params.studentId,
      Number(amount),
      description,
      req.user._id
    );
    res.status(201).json({
      success: true,
      message: 'Refund request submitted. Pending admin approval.',
      data: tx,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFeeInfo, deposit, withdraw };
