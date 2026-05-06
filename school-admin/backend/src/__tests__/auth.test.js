/**
 * Authentication Tests - school-admin backend
 * Purpose: Verify admin/staff authentication flows and account creation.
 * Covers:
 * - `login()` in `src/services/authService.js` (credential checks, JWT generation)
 * - `createStaff()` in `src/services/authService.js` (staff creation and validation)
 * Notes:
 * - Uses `AdminUser` model mocks to simulate DB queries and password checks.
 */

const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const { login, createStaff } = require('../services/authService');

// Mock the AdminUser model
jest.mock('../models/AdminUser');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret_key';
    process.env.JWT_EXPIRES_IN = '8h';
  });

  describe('login()', () => {
    // This block verifies authentication logic in `authService.login()`:
    // - `AdminUser.findOne` lookup behavior
    // - `verifyPassword` usage for credential validation
    // - `isActive` guards and resulting JWT token generation
    it('should successfully login a valid admin user', async () => {
      const mockAdmin = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@school.rw',
        role: 'admin',
        isActive: true,
        verifyPassword: jest.fn().mockReturnValue(true),
      };

      AdminUser.findOne.mockResolvedValue(mockAdmin);

      const result = await login({
        email: 'admin@school.rw',
        password: 'Admin@1234',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('admin@school.rw');
      expect(result.user.role).toBe('admin');
    });

    it('should fail with invalid credentials', async () => {
      AdminUser.findOne.mockResolvedValue(null);

      await expect(
        login({ email: 'notfound@school.rw', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should fail if user is inactive', async () => {
      const mockAdmin = {
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@school.rw',
        isActive: false,
      };

      AdminUser.findOne.mockResolvedValue(mockAdmin);

      await expect(
        login({ email: 'admin@school.rw', password: 'Admin@1234' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should fail if password verification fails', async () => {
      const mockAdmin = {
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@school.rw',
        isActive: true,
        verifyPassword: jest.fn().mockReturnValue(false),
      };

      AdminUser.findOne.mockResolvedValue(mockAdmin);

      await expect(
        login({ email: 'admin@school.rw', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('createStaff()', () => {
    it('should successfully create a new staff member', async () => {
      AdminUser.findOne.mockResolvedValue(null);
      
      const mockNewStaff = {
        _id: '507f1f77bcf86cd799439012',
        firstName: 'John',
        lastName: 'Teacher',
        email: 'john@school.rw',
        passwordHash: 'hashed_password',
        role: 'teacher',
        isActive: true,
      };

      AdminUser.create.mockResolvedValue(mockNewStaff);

      const result = await createStaff({
        firstName: 'John',
        lastName: 'Teacher',
        email: 'john@school.rw',
        password: 'Teacher@1234',
        role: 'teacher',
      });

      expect(result.email).toBe('john@school.rw');
      expect(result.role).toBe('teacher');
      expect(AdminUser.create).toHaveBeenCalled();
    });

    it('should fail if email already exists', async () => {
      const existingUser = {
        email: 'john@school.rw',
      };

      AdminUser.findOne.mockResolvedValue(existingUser);

      await expect(
        createStaff({
          firstName: 'John',
          lastName: 'Teacher',
          email: 'john@school.rw',
          password: 'Teacher@1234',
          role: 'teacher',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should create staff with correct role', async () => {
      AdminUser.findOne.mockResolvedValue(null);
      
      const mockNewStaff = {
        _id: '507f1f77bcf86cd799439012',
        firstName: 'Jane',
        lastName: 'Admin',
        email: 'jane@school.rw',
        role: 'admin',
      };

      AdminUser.create.mockResolvedValue(mockNewStaff);

      const result = await createStaff({
        firstName: 'Jane',
        lastName: 'Admin',
        email: 'jane@school.rw',
        password: 'Admin@1234',
        role: 'admin',
      });

      expect(result.role).toBe('admin');
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate a valid JWT token', async () => {
      const mockAdmin = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@school.rw',
        role: 'admin',
        isActive: true,
        verifyPassword: jest.fn().mockReturnValue(true),
      };

      AdminUser.findOne.mockResolvedValue(mockAdmin);

      const result = await login({
        email: 'admin@school.rw',
        password: 'Admin@1234',
      });

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(mockAdmin._id.toString());
      expect(decoded.role).toBe('admin');
    });
  });
});
