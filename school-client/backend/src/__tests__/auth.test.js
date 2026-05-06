/**
 * Authentication Service Tests - school-client backend
 * Purpose: Basic client auth checks for students/parents (login and registration errors).
 * Covers:
 * - `login()` and `register()` in `school-client/src/services/authService.js`
 * Notes:
 * - Uses `User` model mocks to emulate DB lookups and registration guards.
 */

const User = require('../models/User');
const { login, register } = require('../services/authService');

jest.mock('../models/User');

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
  });
});
