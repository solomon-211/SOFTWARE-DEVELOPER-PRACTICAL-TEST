const { register, login, refreshSession, revokeRefreshToken } = require('../services/authService');
const { toPublicUser } = require('../dtos/userDto');

/**
 * POST /api/auth/register
 * Register a new parent or student account.
 */
const registerUser = async (req, res, next) => {
  try {
    const { user, token, refreshToken } = await register(req.body);
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
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
    const { user, token, refreshToken } = await login(req.body);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
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
 * POST /api/auth/refresh
 * Use refresh token cookie to renew access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies || {};
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });
    const { user, token, refreshToken: newRefresh } = await refreshSession(refreshToken);
    // Set rotated refresh token
    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    res.json({ success: true, data: { user: toPublicUser(user), token } });
  } catch (err) { next(err); }
};

/**
 * POST /api/auth/logout
 */
const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies || {};
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
const getMe = async (req, res) => {
  res.json({ success: true, data: toPublicUser(req.user) });
};

module.exports = { registerUser, loginUser, getMe, refreshToken, logoutUser };
