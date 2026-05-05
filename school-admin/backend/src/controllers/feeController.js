const feeService = require('../services/feeService');

const getAllTransactions = async (req, res, next) => {
  try {
    const data = await feeService.getAllTransactions(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const processTransaction = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const data = await feeService.processTransaction(req.params.txId, action, req.user._id);
    res.json({ success: true, message: `Transaction ${action}d`, data });
  } catch (err) { next(err); }
};

const getFeeStats = async (req, res, next) => {
  try {
    const data = await feeService.getFeeStats();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getAllTransactions, processTransaction, getFeeStats };
