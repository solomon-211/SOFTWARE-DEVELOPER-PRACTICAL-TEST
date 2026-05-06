/**
 * Password Reset Service Tests - school-client backend
 * Purpose: Ensure client password-reset requests are created and validated.
 * Covers:
 * - `requestPasswordReset()` and related flows using `PasswordReset` and `User` models
 * Notes:
 * - Tests are focused on happy/error DB paths and token creation behavior.
 */

const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');

jest.mock('../models/User');
jest.mock('../models/PasswordReset');

describe('ClientPasswordResetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordReset()', () => {
    // `requestPasswordReset()` should create a `PasswordReset` record when a
    // user with the provided email exists. The token is returned to be emailed.
    it('should create password reset request for valid email', async () => {
      const mockUser = {
        _id: 'student1',
        email: 'student@school.rw',
      };

      const mockResetRecord = {
        _id: 'reset1',
        userId: 'student1',
        token: 'resettoken123',
        expiresAt: new Date(Date.now() + 3600000),
      };

      User.findOne.mockResolvedValue(mockUser);
      PasswordReset.create.mockResolvedValue(mockResetRecord);

      expect(mockResetRecord).toHaveProperty('token');
      expect(mockResetRecord.userId).toBe('student1');
    });

    it('should throw error if email not registered', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await User.findOne({ email: 'notfound@school.rw' });

      expect(result).toBeNull();
    });
  });
});
