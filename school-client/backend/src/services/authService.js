const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');

/**
 * Generate a signed JWT for a user.
 * @param {object} user - Mongoose User document
 * @returns {string} JWT token
 */
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

/**
 * Generate a refresh token (longer lived) and return it.
 * Stored in DB for rotation/revocation support.
 */
const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

/**
 * Register a new parent or student account.
 * @param {object} data - { firstName, lastName, email, phone, password, role, deviceId, deviceName }
 * @returns {{ user, token, refreshToken }}
 */
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

    // Optional email lock: if invite was sent to specific email, enforce it.
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

  // If invite token is provided, auto-link this new account to the invited student.
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
  // Persist refresh token to user record
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: refreshToken, lastUsedAt: new Date() });
  await user.save();
  return { user, token, refreshToken };
};

/**
 * Authenticate a user with email, password, and device ID.
 * @param {object} data - { email, password, deviceId }
 * @returns {{ user, token }}
 */
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

  // Register device if not already known
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
    // Check token exists in DB
    const stored = (user.refreshTokens || []).find((t) => t.token === refreshToken);
    if (!stored) {
      const err = new Error('Refresh token revoked'); err.statusCode = 401; throw err;
    }

    // Enforce inactivity timeout for refresh sessions.
    const idleTimeoutMinutes = Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES) || 30;
    const idleCutoffMs = idleTimeoutMinutes * 60 * 1000;
    const lastActivity = stored.lastUsedAt || stored.createdAt;
    if (!lastActivity || (Date.now() - new Date(lastActivity).getTime()) > idleCutoffMs) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== refreshToken);
      await user.save();
      const err = new Error('Session expired due to inactivity'); err.statusCode = 401; throw err;
    }

    // Generate new tokens (rotate)
    const token = generateToken(user);
    const newRefresh = generateRefreshToken(user);

    // Replace old refresh token with the new one
    user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefresh, lastUsedAt: new Date() });
    await user.save();

    return { user, token, refreshToken: newRefresh };
  } catch (err) {
    const e = new Error('Invalid refresh token'); e.statusCode = 401; throw e;
  }
};

/**
 * Logout / revoke a refresh token
 */
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
