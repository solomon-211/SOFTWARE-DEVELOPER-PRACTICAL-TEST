const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

const register = async (data) => {
  const { firstName, lastName, email, phone, password, role, deviceId, deviceName, inviteToken } = data;

  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  let invitedStudent = null;
  if (inviteToken) {
    const inviteHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    invitedStudent = await Student.findOne({
      'invite.tokenHash': inviteHash,
      'invite.usedAt': null,
      'invite.expiresAt': { $gt: new Date() },
    });

    if (!invitedStudent) {
      const err = new Error('Invalid or expired invite token');
      err.statusCode = 400;
      throw err;
    }

    if (invitedStudent.invite?.email && invitedStudent.invite.email !== email.toLowerCase().trim()) {
      const err = new Error('Invite token email does not match this account email');
      err.statusCode = 400;
      throw err;
    }

    if (invitedStudent.userId) {
      const err = new Error('Student is already linked to another account');
      err.statusCode = 400;
      throw err;
    }
  }

  const passwordHash = User.hashPassword(password);

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    role: role || 'parent',
    devices: [{ deviceId, deviceName: deviceName || 'Unknown Device', verified: false }],
  });

  if (invitedStudent) {
    invitedStudent.userId = user._id;
    invitedStudent.invite.usedAt = new Date();

    if (user.role === 'student') {
      user.studentProfile = invitedStudent._id;
    } else {
      user.children = user.children || [];
      if (!user.children.map(String).includes(String(invitedStudent._id))) {
        user.children.push(invitedStudent._id);
      }
    }

    await Promise.all([invitedStudent.save(), user.save()]);
  }

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: refreshToken, lastUsedAt: new Date() });
  await user.save();
  return { user, token, refreshToken };
};

const login = async (data) => {
  const { email, password, deviceId } = data;

  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  if (!user.verifyPassword(password)) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const knownDevice = user.devices.find((d) => d.deviceId === deviceId);
  if (!knownDevice) {
    user.devices.push({ deviceId, deviceName: 'Unknown Device', verified: false });
    await user.save();
  }

  if (!user.isDeviceVerified(deviceId)) {
    const err = new Error('Device not verified. Please wait for admin approval.');
    err.statusCode = 403;
    throw err;
  }

  // Auto-link: if this is a student account with no studentProfile set,
  // try to find a matching student record by userId or by name+email.
  if (user.role === 'student' && !user.studentProfile) {
    let studentRecord = await Student.findOne({ userId: user._id });
    if (!studentRecord) {
      // Try matching by first+last name (admin-created students without invite)
      studentRecord = await Student.findOne({
        firstName: { $regex: new RegExp(`^${user.firstName}$`, 'i') },
        lastName:  { $regex: new RegExp(`^${user.lastName}$`, 'i') },
        userId:    null,
      });
    }
    if (studentRecord) {
      studentRecord.userId = user._id;
      user.studentProfile = studentRecord._id;
      await Promise.all([studentRecord.save(), user.save()]);
    }
  }

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: refreshToken, lastUsedAt: new Date() });
  await user.save();
  return { user, token, refreshToken };
};

/**
 * Refresh session using a refresh token. Rotates refresh token on use.
 * @param {string} refreshToken
 * @returns {{ user, token, refreshToken }}
 */
const refreshSession = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') throw new Error('Invalid token');
    const user = await User.findById(decoded.id);
    if (!user) {
      const err = new Error('User not found'); err.statusCode = 404; throw err;
    }
    const stored = (user.refreshTokens || []).find((t) => t.token === refreshToken);
    if (!stored) {
      const err = new Error('Refresh token revoked'); err.statusCode = 401; throw err;
    }

    const idleTimeoutMinutes = Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES) || 30;
    const idleCutoffMs = idleTimeoutMinutes * 60 * 1000;
    const lastActivity = stored.lastUsedAt || stored.createdAt;
    if (!lastActivity || (Date.now() - new Date(lastActivity).getTime()) > idleCutoffMs) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== refreshToken);
      await user.save();
      const err = new Error('Session expired due to inactivity'); err.statusCode = 401; throw err;
    }

    const token = generateToken(user);
    const newRefresh = generateRefreshToken(user);

    user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefresh, lastUsedAt: new Date() });
    await user.save();

    return { user, token, refreshToken: newRefresh };
  } catch (err) {
    const e = new Error('Invalid refresh token'); e.statusCode = 401; throw e;
  }
};

const revokeRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return;
    user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== refreshToken);
    await user.save();
  } catch (e) { /* ignore */ }
};

module.exports = { register, login, generateToken, generateRefreshToken, refreshSession, revokeRefreshToken };
