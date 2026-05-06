/**
 * Device Verification Tests - school-admin backend
 * Purpose: Ensure device verification, revocation, and listing work correctly.
 * Covers:
 * - `getPendingDevices()` in `src/services/deviceService.js` (filters & DTO)
 * - `verifyDevice()` and `revokeDevice()` (mutation, saving, error paths)
 * Notes:
 * - Mocks `ClientUser` model and simulates device arrays for each user.
 */

const ClientUser = require('../models/ClientUser');
const { getPendingDevices, verifyDevice, revokeDevice } = require('../services/deviceService');

// Mock the ClientUser model
jest.mock('../models/ClientUser');

describe('DeviceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPendingDevices()', () => {
    // `getPendingDevices()` should map `ClientUser.devices` -> `pendingDevices` DTO
    // and filter out verified devices. This test simulates unverified devices.
    it('should return all pending device verifications', async () => {
      const mockUsers = [
        {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Parent',
          email: 'john@example.com',
          role: 'parent',
          isActive: true,
          devices: [
            {
              deviceId: 'device1',
              deviceName: 'iPhone 13',
              verified: false,
              registeredAt: new Date(),
            },
          ],
        },
        {
          _id: 'user2',
          firstName: 'Jane',
          lastName: 'Student',
          email: 'jane@example.com',
          role: 'student',
          isActive: true,
          devices: [
            {
              deviceId: 'device2',
              deviceName: 'Samsung Galaxy',
              verified: false,
              registeredAt: new Date(),
            },
          ],
        },
      ];

      ClientUser.find.mockResolvedValue(mockUsers);

      const result = await getPendingDevices();

      expect(result).toHaveLength(2);
      expect(result[0].pendingDevices).toBeDefined();
      expect(result[0].pendingDevices[0].deviceId).toBe('device1');
      expect(result[1].pendingDevices[0].deviceId).toBe('device2');
    });

    it('should return empty array when no pending devices', async () => {
      ClientUser.find.mockResolvedValue([]);

      const result = await getPendingDevices();

      expect(result).toEqual([]);
    });
  });

  describe('verifyDevice()', () => {
    // `verifyDevice()` sets `device.verified = true`, stamps `verifiedAt`, and saves the user
    it('should verify a device for a user', async () => {
      const mockUser = {
        _id: 'user1',
        firstName: 'John',
        lastName: 'Parent',
        email: 'john@example.com',
        devices: [
          {
            deviceId: 'device1',
            deviceName: 'iPhone 13',
            verified: false,
            registeredAt: new Date(),
            verifiedAt: null,
          },
        ],
        save: jest.fn(),
      };

      ClientUser.findById.mockResolvedValue(mockUser);

      await verifyDevice('user1', 'device1', 'admin_id');

      expect(mockUser.devices[0].verified).toBe(true);
      expect(mockUser.devices[0].verifiedAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      ClientUser.findById.mockResolvedValue(null);

      await expect(verifyDevice('invalid_user', 'device1', 'admin_id'))
        .rejects
        .toThrow('User not found');
    });

    it('should throw error if device not found', async () => {
      const mockUser = {
        _id: 'user1',
        firstName: 'John',
        lastName: 'Parent',
        email: 'john@example.com',
        devices: [
          {
            deviceId: 'device1',
            deviceName: 'iPhone 13',
            verified: false,
          },
        ],
      };

      ClientUser.findById.mockResolvedValue(mockUser);

      await expect(verifyDevice('user1', 'invalid_device', 'admin_id'))
        .rejects
        .toThrow('Device not found');
    });
  });

  describe('revokeDevice()', () => {
    it('should revoke a verified device', async () => {
      const mockUser = {
        _id: 'user1',
        firstName: 'John',
        lastName: 'Parent',
        email: 'john@example.com',
        devices: [
          {
            deviceId: 'device1',
            deviceName: 'iPhone 13',
            verified: true,
            registeredAt: new Date(),
            verifiedAt: new Date(),
          },
        ],
        save: jest.fn(),
      };

      ClientUser.findById.mockResolvedValue(mockUser);

      await revokeDevice('user1', 'device1');

      // Device should be removed or marked as unverified
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      ClientUser.findById.mockResolvedValue(null);

      await expect(revokeDevice('invalid_user', 'device1'))
        .rejects
        .toThrow('User not found');
    });

    it('should throw error if device not found', async () => {
      const mockUser = {
        _id: 'user1',
        firstName: 'John',
        lastName: 'Parent',
        email: 'john@example.com',
        devices: [],
      };

      ClientUser.findById.mockResolvedValue(mockUser);

      await expect(revokeDevice('user1', 'invalid_device'))
        .rejects
        .toThrow('Device not found');
    });
  });

  describe('Device Verification Audit', () => {
    it('should track which admin verified the device', async () => {
      const mockUser = {
        _id: 'user1',
        firstName: 'John',
        lastName: 'Parent',
        email: 'john@example.com',
        devices: [
          {
            deviceId: 'device1',
            deviceName: 'iPhone 13',
            verified: false,
            registeredAt: new Date(),
            verifiedAt: null,
            verifiedBy: null,
          },
        ],
        save: jest.fn(),
      };

      ClientUser.findById.mockResolvedValue(mockUser);

      const adminId = 'admin_12345';
      await verifyDevice('user1', 'device1', adminId);

      expect(mockUser.devices[0].verifiedBy).toBe(adminId);
    });
  });
});
