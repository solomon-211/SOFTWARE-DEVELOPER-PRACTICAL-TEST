/**
 * ============================================================================
 * DEVICE VERIFICATION SERVICE - ADMIN
 * ============================================================================
 * 
 * Manages device registration and verification for client app access.
 * 
 * Device Security Model:
 * - Users register devices when logging in
 * - Each device gets unique deviceId
 * - Devices must be approved by admin before access
 * - Once verified, device can login without re-approval
 * - Admin can revoke device access anytime
 * 
 * Benefits:
 * - Prevents unauthorized logins from unverified devices
 * - Tracks which devices are accessing the system
 * - Admin can revoke compromised devices
 * - Protects student/parent data
 * 
 * Shared Collection:
 * - ClientUser data is shared between admin and client apps
 * - Changes here immediately visible to client app
 * - Device verifications take effect on next login
 */

const ClientUser = require('../models/ClientUser');
const { toClientUser } = require('../dtos/adminDto');
const { notify } = require('./emailService');

/**
 * Get all users with pending (unverified) devices
 * 
 * Returns: List of users that have at least one unverified device
 * Filters out users with no pending devices
 * 
 * Data Returned:
 * {
 *   userId: "60d5ec49...",
 *   firstName: "John",
 *   lastName: "Doe",
 *   email: "john@email.com",
 *   role: "parent",
 *   pendingDevices: [
 *     { deviceId: "device123", deviceName: "iPhone 13", registeredAt: Date }
 *   ]
 * }
 * 
 * Use Case: Admin dashboard shows devices awaiting approval
 * 
 * @static
 * @returns {Promise<Array>} Users with unverified devices
 * 
 * @example
 * const pending = await getPendingDevices();
 * // Shows all devices registered but not yet approved
 * console.log(pending[0].pendingDevices);  // Devices awaiting approval
 */
const getPendingDevices = async () => {
  const users = await ClientUser.find({ isActive: true });

  return users
    .map((u) => ({
      userId:    u._id,
      firstName: u.firstName,
      lastName:  u.lastName,
      email:     u.email,
      role:      u.role,
      // Filter to only unverified devices
      pendingDevices: u.devices
        .filter((d) => !d.verified)
        .map((d) => ({
          deviceId:     d.deviceId,
          deviceName:   d.deviceName,
          registeredAt: d.registeredAt,
        })),
    }))
    // Filter to only users with pending devices
    .filter((u) => u.pendingDevices.length > 0);
};

/**
 * Get all active client users with device status
 * 
 * Returns: All users with complete device information
 * Includes both verified and unverified devices
 * 
 * Use Case: Admin overview of all client app users
 * 
 * @static
 * @returns {Promise<Array>} All active ClientUser objects (as DTOs)
 * 
 * @example
 * const allUsers = await getAllUsers();
 * console.log(allUsers[0].devices);  // All devices (verified & unverified)
 */
const getAllUsers = async () => {
  const users = await ClientUser.find({ isActive: true }).sort({ createdAt: -1 });
  return users.map(toClientUser);
};

/**
 * Approve a device for login access
 * 
 * Workflow:
 * 1. Find user
 * 2. Find device by deviceId
 * 3. Mark device as verified
 * 4. Set verification timestamp and admin ID
 * 5. Send notification email to user
 * 6. Save to shared collection (client app sees immediately)
 * 
 * Effect: User can now login from this device
 * 
 * Shared Collection:
 * - ClientUser is shared between admin and client apps
 * - Changes persist to shared database
 * - Client app reads verified flag on login attempt
 * 
 * Notification:
 * - User receives email: "Your device has been approved"
 * - Device can now be used for login
 * 
 * @static
 * @param {string} userId - ClientUser ID
 * @param {string} deviceId - Device ID to verify
 * @param {string} adminId - Admin ID for audit trail
 * @returns {Promise<Object>} Updated user (as DTO)
 * @throws {Error} 404 if user or device not found
 * 
 * @example
 * const updated = await verifyDevice(
 *   '60d5ec49c1234567890abcd1',
 *   'deviceId123',
 *   adminUserId
 * );
 * // User can now login from deviceId123
 */
const verifyDevice = async (userId, deviceId, adminId) => {
  // Find user by ID
  const user = await ClientUser.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Find device in user's devices array
  const device = user.devices.find((d) => d.deviceId === deviceId);
  if (!device) {
    const err = new Error('Device not found for this user');
    err.statusCode = 404;
    throw err;
  }

  // Mark device as verified with approval details
  device.verified   = true;
  device.verifiedAt = new Date();  // When approved
  device.verifiedBy = adminId;     // Who approved it
  await user.save();

  // Send notification to user about device approval
  notify.deviceVerified(user).catch(() => {});

  // Return updated user with all devices
  return toClientUser(user);
};

/**
 * Revoke device verification (ban device from login)
 * 
 * Workflow:
 * 1. Find user
 * 2. Find device
 * 3. Mark device as unverified
 * 4. Clear verification timestamp and admin ID
 * 5. Save changes (client app sees immediately)
 * 
 * Effect: User cannot login from this device anymore
 * 
 * Use Cases:
 * - Device compromised (security incident)
 * - User reported lost phone
 * - Device no longer in use
 * 
 * Result:
 * - Device can be re-registered and re-verified later
 * - Current sessions from device not affected
 * - Next login from device will fail
 * 
 * @static
 * @param {string} userId - ClientUser ID
 * @param {string} deviceId - Device ID to revoke
 * @returns {Promise<Object>} Updated user (as DTO)
 * @throws {Error} 404 if user or device not found
 * 
 * @example
 * const updated = await revokeDevice(
 *   '60d5ec49c1234567890abcd1',
 *   'deviceId123'
 * );
 * // User cannot login from deviceId123 anymore
 */
const revokeDevice = async (userId, deviceId) => {
  // Find user
  const user = await ClientUser.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Find device
  const device = user.devices.find((d) => d.deviceId === deviceId);
  if (!device) {
    const err = new Error('Device not found');
    err.statusCode = 404;
    throw err;
  }

  // Revoke verification
  device.verified   = false;
  device.verifiedAt = undefined;  // Clear approval timestamp
  device.verifiedBy = undefined;  // Clear who approved
  await user.save();

  return toClientUser(user);
};

module.exports = { getPendingDevices, getAllUsers, verifyDevice, revokeDevice };
