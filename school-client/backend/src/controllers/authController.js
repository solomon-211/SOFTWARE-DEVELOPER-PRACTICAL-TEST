const { register, login } = require('../services/authService');
const { toPublicUser } = require('../dtos/userDto');

/**
 * POST /api/auth/register
 * Register a new parent or student account.
 */
const registerUser = async (req, res, next) => {
  try {
    const { user, token } = await register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for device verification by admin.',
      data: { user: toPublicUser(user), token },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Authenticate a user with email, password, and device ID.
 */
const loginUser = async (req, res, next) => {
  try {
    const { user, token } = await login(req.body);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: toPublicUser(user), token },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
const getMe = async (req, res) => {
  res.json({ success: true, data: toPublicUser(req.user) });
};

module.exports = { registerUser, loginUser, getMe };
