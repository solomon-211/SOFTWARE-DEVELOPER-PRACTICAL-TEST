const Student = require('../models/Student');
const FeeTransaction = require('../models/FeeTransaction');
const { toTransaction } = require('../dtos/userDto');
const { uploadProof } = require('./cloudinaryService');

/**
 * Deposit (fee payment) for a student.
 * Uploads proof to Cloudinary and stores the URL.
 */
const deposit = async (studentId, amount, description, proof, initiatedBy) => {
  const student = await Student.findById(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  if (!proof || !proof.value) {
    const err = new Error('Payment proof is required (upload a file or provide a link)');
    err.statusCode = 400;
    throw err;
  }

  let storedProof = proof;

  // If it's a file (base64), upload to Cloudinary and replace with URL
  if (proof.type === 'file' && proof.value.startsWith('data:')) {
    const { url, publicId } = await uploadProof(proof.value, 'fee-proofs');
    storedProof = { type: 'file', value: url, publicId, mimeType: proof.mimeType };
  }

  const tx = await FeeTransaction.create({
    student:       studentId,
    type:          'deposit',
    amount,
    description:   description || 'Fee payment',
    proof:         storedProof,
    status:        'pending',
    balanceBefore: student.feeBalance,
    balanceAfter:  student.feeBalance + amount,
    initiatedBy,
  });

  return toTransaction(tx);
};

/**
 * Withdraw (refund request) for a student.
 * @param {string} studentId
 * @param {number} amount
 * @param {string} description
 * @param {string} initiatedBy
 */
const withdraw = async (studentId, amount, description, initiatedBy) => {
  const student = await Student.findById(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  if (student.feeBalance < amount) {
    const err = new Error('Insufficient balance for withdrawal');
    err.statusCode = 400;
    throw err;
  }

  const tx = await FeeTransaction.create({
    student:       studentId,
    type:          'withdrawal',
    amount,
    description:   description || 'Refund request',
    status:        'pending',
    balanceBefore: student.feeBalance,
    balanceAfter:  student.feeBalance - amount,
    initiatedBy,
  });

  return toTransaction(tx);
};

/**
 * Get fee balance and transaction history for a student.
 */
const getFeeInfo = async (studentId) => {
  const student = await Student.findById(studentId).select('feeBalance');
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  const transactions = await FeeTransaction.find({ student: studentId })
    .sort({ createdAt: -1 })
    .limit(50);

  return {
    balance:      student.feeBalance,
    transactions: transactions.map(toTransaction),
  };
};

module.exports = { deposit, withdraw, getFeeInfo };
