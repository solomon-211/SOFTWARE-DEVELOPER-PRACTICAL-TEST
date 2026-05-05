const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a signed JWT for a user.
 * @param {object} user - Mongoose User document
 * @returns {string} JWT token
 */
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

/**
 * Register a new parent or student account.
 * @param {object} data - { firstName, lastName, email, phone, password, role, deviceId, deviceName }
 * @returns {{ user, token }}
 */
const register = async (data) => {
  const { firstName, lastName, email, phone, password, role, deviceId, deviceName } = data;

  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
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

  const token = generateToken(user);
  return { user, token };
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
  return { user, token };
};

module.exports = { register, login, generateToken };
