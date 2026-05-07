const FeeTransaction = require('../models/FeeTransaction');
const Student        = require('../models/Student');
const ClientUser     = require('../models/ClientUser');
const { toTransaction } = require('../dtos/adminDto');
const { log }        = require('./auditService');
const { notify }     = require('./emailService');

const getAllTransactions = async (query = {}) => {
  const filter = {};
  if (query.studentId) filter.student = query.studentId;
  if (query.status)    filter.status  = query.status;
  if (query.type)      filter.type    = query.type;

  const txs = await FeeTransaction.find(filter)
    .populate('student', 'firstName lastName studentCode')
    .sort({ createdAt: -1 })
    .limit(200);

  return txs.map(toTransaction);
};

const processTransaction = async (txId, action, adminId) => {
  const tx = await FeeTransaction.findById(txId);
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }

  if (tx.status !== 'pending') {
    const err = new Error('Transaction has already been processed');
    err.statusCode = 400;
    throw err;
  }

  const student = await Student.findById(tx.student);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  if (action === 'approve') {
    if (tx.type === 'deposit') {
      student.feeBalance += tx.amount;
      tx.balanceAfter = student.feeBalance;
    } else {
      if (student.feeBalance < tx.amount) {
        const err = new Error('Insufficient balance to approve withdrawal');
        err.statusCode = 400;
        throw err;
      }
      student.feeBalance -= tx.amount;
      tx.balanceAfter = student.feeBalance;
    }

    tx.status = 'approved';
    await student.save();
  } else {
    tx.status = 'rejected';
  }

  tx.processedBy = adminId;
  tx.processedAt = new Date();
  await tx.save();

  await log({
    actor: adminId, actorModel: 'AdminUser',
    action: `fee.${action}`,
    target: `FeeTransaction:${txId}`,
    after: { type: tx.type, amount: tx.amount, status: tx.status },
  });

  try {
    const user = await ClientUser.findById(tx.initiatedBy).select('email firstName');
    if (user) {
      if (tx.type === 'deposit') {
        action === 'approve'
          ? await notify.paymentApproved(user, tx.amount)
          : await notify.paymentRejected(user, tx.amount);
      } else {
        if (action === 'approve') await notify.refundApproved(user, tx.amount);
      }
    }
  } catch (e) { console.error('Email notification error:', e.message); }

  return toTransaction(tx);
};

const getFeeStats = async () => {
  const [totalDeposited, totalWithdrawn, pendingCount] = await Promise.all([
    FeeTransaction.aggregate([
      { $match: { type: 'deposit', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    FeeTransaction.aggregate([
      { $match: { type: 'withdrawal', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    FeeTransaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
  ]);

  return {
    totalDeposited:    totalDeposited[0]?.total  || 0,
    totalWithdrawn:    totalWithdrawn[0]?.total  || 0,
    pendingWithdrawals: pendingCount,
  };
};

module.exports = { getAllTransactions, processTransaction, getFeeStats };
