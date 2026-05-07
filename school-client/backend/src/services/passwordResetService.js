const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { notify } = require('./emailService');

const requestReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return;

  await PasswordReset.deleteMany({ userId: user._id });

  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await PasswordReset.create({ userId: user._id, userModel: 'User', token, expiresAt });

  const resetUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/reset-password?token=${token}`;
  await notify.passwordReset(user, resetUrl);
};

const resetPassword = async (token, newPassword) => {
  const record = await PasswordReset.findOne({ token, used: false });
  if (!record || record.expiresAt < new Date()) {
    const err = new Error('Reset link is invalid or has expired');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(record.userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  user.passwordHash = User.hashPassword(newPassword);
  await user.save();

  record.used = true;
  await record.save();
};

module.exports = { requestReset, resetPassword };
