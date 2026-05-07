/**
 * Authentication Service Tests - school-client backend
 * Purpose: Basic client auth checks for students/parents (login and registration errors).
 * Covers:
 * - `login()` and `register()` in `school-client/src/services/authService.js`
 * Notes:
 * - Uses `User` model mocks to emulate DB lookups and registration guards.
 */

const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const { login, register, refreshSession } = require('../services/authService');

jest.mock('../models/User');
jest.mock('../models/Student');
jest.mock('jsonwebtoken');

describe('ClientAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login()', () => {
    // `login()` validates presence of user and password verification.
    // Here we ensure invalid email path throws `Invalid credentials`.
    it('should fail with invalid email', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        login({ email: 'notfound@school.rw', password: 'pass', deviceId: 'dev1' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register()', () => {
    // `register()` checks for existing email via `User.findOne()` and
    // rejects with a 409-style error when duplicate is found.
    it('should fail if email already registered', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(
        register({
          firstName: 'Test',
          email: 'test@school.rw',
          password: 'pass',
          role: 'student',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should fail when invite token is invalid', async () => {
      User.findOne.mockResolvedValue(null);
      Student.findOne.mockResolvedValue(null);

      await expect(
        register({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@school.rw',
          password: 'password123',
          role: 'parent',
          deviceId: 'dev1',
          inviteToken: 'bad-token',
        })
      ).rejects.toThrow('Invalid or expired invite token');
    });

    it('should link invited student on successful register', async () => {
      User.findOne.mockResolvedValue(null);

      const studentSave = jest.fn().mockResolvedValue(true);
      const invitedStudent = {
        _id: 'student1',
        userId: null,
        invite: { email: 'parent@school.rw', usedAt: null },
        save: studentSave,
      };
      Student.findOne.mockResolvedValue(invitedStudent);

      const createdUser = {
        _id: 'user1',
        role: 'parent',
        children: [],
        refreshTokens: [],
        save: jest.fn().mockResolvedValue(true),
      };
      User.hashPassword.mockReturnValue('hashed');
      User.create.mockResolvedValue(createdUser);
      jwt.sign.mockReturnValue('signed-token');

      const result = await register({
        firstName: 'Parent',
        lastName: 'One',
        email: 'parent@school.rw',
        password: 'password123',
        role: 'parent',
        deviceId: 'dev1',
        inviteToken: 'valid-invite-token-123',
      });

      expect(result.user._id).toBe('user1');
      expect(invitedStudent.userId).toBe('user1');
      expect(studentSave).toHaveBeenCalled();
      expect(createdUser.children).toContain('student1');
    });
  });

  describe('refreshSession()', () => {
    it('should fail when session has expired due to inactivity', async () => {
      process.env.SESSION_IDLE_TIMEOUT_MINUTES = '30';

      jwt.verify.mockReturnValue({ id: 'user1', type: 'refresh' });
      const staleTime = new Date(Date.now() - 40 * 60 * 1000);
      const mockUser = {
        _id: 'user1',
        refreshTokens: [{ token: 'rtok', lastUsedAt: staleTime }],
        save: jest.fn().mockResolvedValue(true),
      };
      User.findById.mockResolvedValue(mockUser);

      await expect(refreshSession('rtok')).rejects.toThrow('Invalid refresh token');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
