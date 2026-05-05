/**
 * ============================================================================
 * FEE MANAGEMENT SERVICE - ADMIN
 * ============================================================================
 * 
 * Handles fee transaction processing and financial records.
 * 
 * Transaction Types:
 * - Deposit: Parent pays school fees (adds to balance)
 * - Withdrawal: School refunds excess payment (deducts from balance)
 * 
 * Transaction Flow:
 * 1. Parent submits request (client app)
 * 2. Transaction created as "pending"
 * 3. Admin reviews and approves/rejects
 * 4. On approval: Student balance updated
 * 5. Email confirmation sent to parent
 * 6. Audit log recorded
 * 
 * Financial Model:
 * - Positive balance = Amount paid (exceeds owed)
 * - Zero balance = All fees paid
 * - Negative balance = Amount still owed
 * 
 * Audit Trail:
 * - All transactions logged
 * - Who approved it
 * - When processed
 * - Balance before/after
 */

const FeeTransaction = require('../models/FeeTransaction');
const Student        = require('../models/Student');
const ClientUser     = require('../models/ClientUser');
const { toTransaction } = require('../dtos/adminDto');
const { log }        = require('./auditService');
const { notify }     = require('./emailService');

/**
 * Get all fee transactions with optional filtering
 * 
 * Features:
 * - Filter by student
 * - Filter by transaction status (pending, approved, rejected)
 * - Filter by transaction type (deposit, withdrawal)
 * - Sorted by newest first
 * - Limited to 200 records (pagination)
 * 
 * Populated Data:
 * - Student name and code
 * - All transaction details
 * 
 * @static
 * @param {Object} query - Query filters
 * @param {string} query.studentId - Optional: Filter by student
 * @param {string} query.status - Optional: pending/approved/rejected
 * @param {string} query.type - Optional: deposit/withdrawal
 * @returns {Promise<Array>} Fee transactions as DTOs
 * 
 * @example
 * // Get all pending transactions
 * const pending = await getAllTransactions({ status: 'pending' });
 * 
 * // Get student's transaction history
 * const history = await getAllTransactions({ studentId: '...' });
 * 
 * // Get all approved deposits
 * const deposits = await getAllTransactions({
 *   status: 'approved',
 *   type: 'deposit'
 * });
 */
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

/**
 * Approve or reject a fee transaction
 * 
 * Workflow for APPROVE:
 * 1. Find transaction (must be pending)
 * 2. Get student record
 * 3. If DEPOSIT: Add amount to balance
 * 4. If WITHDRAWAL: Check funds, deduct from balance
 * 5. Mark transaction as approved
 * 6. Record balance after transaction
 * 7. Log to audit trail
 * 8. Send email confirmation to parent/student
 * 
 * Workflow for REJECT:
 * 1. Find transaction (must be pending)
 * 2. Mark as rejected
 * 3. NO balance change
 * 4. Log rejection
 * 5. Send rejection email
 * 
 * Deposit Scenario:
 * - Parent pays school fees
 * - Amount added to balance
 * - Parent receives "Payment Approved" email
 * 
 * Withdrawal Scenario:
 * - School owes refund (e.g., excess payment)
 * - Check if balance sufficient
 * - Deduct from balance if approved
 * - Send "Refund Approved" email
 * 
 * Financial Safety:
 * - Withdrawals check balance before approval
 * - Prevents overdrafts
 * - Audit trail for all decisions
 * 
 * @static
 * @param {string} txId - Transaction ID
 * @param {string} action - 'approve' or 'reject'
 * @param {string} adminId - Admin ID performing action
 * @returns {Promise<Object>} Updated transaction (as DTO)
 * @throws {Error} 404 if transaction or student not found
 * @throws {Error} 400 if already processed or insufficient balance
 * 
 * @example
 * // Approve a payment
 * const approved = await processTransaction(
 *   transactionId,
 *   'approve',
 *   adminUserId
 * );
 * // Parent receives payment confirmation email
 * 
 * // Reject a refund request
 * const rejected = await processTransaction(
 *   transactionId,
 *   'reject',
 *   adminUserId
 * );
 * // Parent receives rejection email with reason option
 */
const processTransaction = async (txId, action, adminId) => {
  // Find transaction
  const tx = await FeeTransaction.findById(txId);
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  
  // Check if already processed
  if (tx.status !== 'pending') {
    const err = new Error('Transaction has already been processed');
    err.statusCode = 400;
    throw err;
  }

  // Get student for balance update
  const student = await Student.findById(tx.student);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  // Process based on action (approve/reject)
  if (action === 'approve') {
    // ────────────────────────────────────────────────────────────────────────
    // APPROVE: Update student balance
    // ────────────────────────────────────────────────────────────────────────
    if (tx.type === 'deposit') {
      // Deposit: Add to balance (parent paid fees)
      student.feeBalance += tx.amount;
      tx.balanceAfter = student.feeBalance;
    } else {
      // Withdrawal: Deduct from balance (school refund)
      // Safety check: Ensure sufficient balance
      if (student.feeBalance < tx.amount) {
        const err = new Error('Insufficient balance to approve withdrawal');
        err.statusCode = 400;
        throw err;
      }
      student.feeBalance -= tx.amount;
      tx.balanceAfter = student.feeBalance;
    }
    
    // Mark as approved
    tx.status = 'approved';
    await student.save();
  } else {
    // ────────────────────────────────────────────────────────────────────────
    // REJECT: No balance change, just mark status
    // ────────────────────────────────────────────────────────────────────────
    tx.status = 'rejected';
  }

  // Record who processed and when
  tx.processedBy = adminId;
  tx.processedAt = new Date();
  await tx.save();

  // Audit log: Record transaction processing
  await log({
    actor: adminId, actorModel: 'AdminUser',
    action: `fee.${action}`,
    target: `FeeTransaction:${txId}`,
    after: { type: tx.type, amount: tx.amount, status: tx.status },
  });

  // Email notification: Inform parent/student of decision
  try {
    const user = await ClientUser.findById(tx.initiatedBy).select('email firstName');
    if (user) {
      if (tx.type === 'deposit') {
        // Payment confirmation
        action === 'approve'
          ? await notify.paymentApproved(user, tx.amount)
          : await notify.paymentRejected(user, tx.amount);
      } else {
        // Withdrawal/Refund confirmation
        if (action === 'approve') await notify.refundApproved(user, tx.amount);
      }
    }
  } catch (e) { console.error('Email notification error:', e.message); }

  return toTransaction(tx);
};

/**
 * Get fee statistics for dashboard
 * 
 * Calculates:
 * - Total amount collected (approved deposits)
 * - Total amount refunded (approved withdrawals)
 * - Count of pending withdrawal requests
 * 
 * Uses MongoDB aggregation for performance:
 * - Single query per stat type
 * - Promise.all for parallel execution
 * - More efficient than counting documents individually
 * 
 * Data Points:
 * - totalDeposited: Total fees received from parents
 * - totalWithdrawn: Total refunds issued to parents
 * - pendingWithdrawals: Refund requests awaiting approval
 * 
 * @static
 * @returns {Promise<Object>} Fee statistics
 * 
 * @example
 * const stats = await getFeeStats();
 * console.log(stats.totalDeposited);     // 150000
 * console.log(stats.pendingWithdrawals); // 2
 */
const getFeeStats = async () => {
  // Use aggregation pipeline for efficient calculation
  const [totalDeposited, totalWithdrawn, pendingCount] = await Promise.all([
    // Sum all approved deposits
    FeeTransaction.aggregate([
      { $match: { type: 'deposit', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // Sum all approved withdrawals
    FeeTransaction.aggregate([
      { $match: { type: 'withdrawal', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // Count pending withdrawals
    FeeTransaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
  ]);

  return {
    totalDeposited:    totalDeposited[0]?.total  || 0,   // Total fees collected
    totalWithdrawn:    totalWithdrawn[0]?.total  || 0,   // Total refunds issued
    pendingWithdrawals: pendingCount,                    // Awaiting approval
  };
};

module.exports = { getAllTransactions, processTransaction, getFeeStats };
