const Student = require('../models/Student');
const User    = require('../models/User');
const FeeTransaction = require('../models/FeeTransaction');
const { toTransaction } = require('../dtos/userDto');
const { uploadProof } = require('./cloudinaryService');

// Helper: find student by record ID, by linked userId, or by name match (same as academicService)
const findStudent = async (studentId) => {
  let student = await Student.findById(studentId);
  if (student) return student;

  student = await Student.findOne({ userId: studentId });
  if (student) return student;

  try {
    const user = await User.findById(studentId).select('firstName lastName role');
    if (user && user.role === 'student') {
      student = await Student.findOne({
        firstName: { $regex: new RegExp(`^${user.firstName}$`, 'i') },
        lastName:  { $regex: new RegExp(`^${user.lastName}$`, 'i') },
      });
      if (student && !student.userId) {
        student.userId = studentId;
        await student.save();
      }
    }
  } catch (_) { /* ignore */ }

  return student || null;
};

// Submit a deposit (fee payment). Proof of payment is required.
// Balance is not updated here — admin must approve the transaction first.
const deposit = async (studentId, amount, description, proof, initiatedBy) => {
  const student = await findStudent(studentId);
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

  if (proof.type === 'file' && proof.value.startsWith('data:')) {
    const { url, publicId } = await uploadProof(proof.value, 'fee-proofs');
    storedProof = { type: 'file', value: url, publicId, mimeType: proof.mimeType };
  }

  const tx = await FeeTransaction.create({
    student:       student._id,
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

// Submit a withdrawal (refund request). Checks balance before creating the transaction.
// Admin must approve before the balance is actually deducted.
const withdraw = async (studentId, amount, description, initiatedBy) => {
  const student = await findStudent(studentId);
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
    student:       student._id,
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

// Get current fee balance and last 50 transactions for a student.
const getFeeInfo = async (studentId) => {
  const student = await findStudent(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  const transactions = await FeeTransaction.find({ student: student._id })
    .sort({ createdAt: -1 })
    .limit(50);

  return {
    balance:      student.feeBalance,
    transactions: transactions.map(toTransaction),
  };
};

module.exports = { deposit, withdraw, getFeeInfo };
