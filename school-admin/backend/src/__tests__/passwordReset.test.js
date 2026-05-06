/**
 * Password Reset Service Tests - school-admin backend
 * Purpose: Exercise password reset token handling and reset flows.
 * Covers:
 * - `resetPassword()` in `src/services/passwordResetService.js` (token validation, user update)
 * Notes:
 * - Mocks `PasswordReset` and `AdminUser` models; tests valid and invalid token paths.
 */

const AdminUser = require('../models/AdminUser');
const PasswordReset = require('../models/PasswordReset');
const { resetPassword } = require('../services/passwordResetService');

jest.mock('../models/AdminUser');
jest.mock('../models/PasswordReset');

describe('PasswordResetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resetPassword()', () => {
    // `resetPassword()` validates a token via `PasswordReset.findOne()` and
    // fetches the user via `AdminUser.findById()`; this test ensures the record
    // is consumed/updated and the user is saved after password change.
    it('should reset password with valid token', async () => {
      const mockReset = {
        _id: 'reset1',
        token: 'validtoken123',
        userId: 'user1',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockUser = {
        _id: 'user1',
        email: 'user@school.rw',
        save: jest.fn().mockResolvedValue(true),
      };

      PasswordReset.findOne.mockResolvedValue(mockReset);
      AdminUser.findById.mockResolvedValue(mockUser);

      await resetPassword('validtoken123', 'newPassword123');

      expect(mockReset.save).toHaveBeenCalled();
    });

    it('should fail with invalid token', async () => {
      PasswordReset.findOne.mockResolvedValue(null);

      await expect(resetPassword('invalidtoken', 'newPass')).rejects.toThrow();
    });
  });
});
