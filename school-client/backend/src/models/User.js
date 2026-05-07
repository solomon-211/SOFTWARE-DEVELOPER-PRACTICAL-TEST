/**
 * ============================================================================
 * USER MODEL (CLIENT)
 * ============================================================================
 * 
 * Mongoose schema for parent and student accounts.
 * 
 * Roles:
 * - student: Can view own grades, attendance, timetable
 * - parent: Can view linked children's academic info and manage fees
 * 
 * Security:
 * - Passwords stored as SHA-512 hashes (never plain text)
 * - Device verification required before account access
 * - Multiple devices supported per user account
 * 
 * Device Verification Workflow:
 * 1. User registers with deviceId
 * 2. Device marked as unverified
 * 3. Admin approves device in admin portal
 * 4. User can now log in from that device
 * 5. Admin can revoke device access anytime
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * User Schema (Parent/Student)
 * 
 * Represents parent and student accounts.
 * Supports multiple verified devices per account.
 */
const userSchema = new mongoose.Schema(
  {
    // Personal Information
    firstName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    lastName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,      // Prevent duplicate accounts
      lowercase: true,   // Normalize email storage
      trim: true 
    },
    phone: { 
      type: String, 
      trim: true 
    },

    // Password Security
    passwordHash: { 
      type: String, 
      required: true     // SHA-512 hash, never plain text
    },

    // Account Type
    role: {
      type: String,
      enum: ['student', 'parent'],
      default: 'parent',
    },

    // ────────────────────────────────────────────────────────────────────────
    // DEVICE VERIFICATION
    // ────────────────────────────────────────────────────────────────────────
    // 
    // Critical for security. Each login requires a verified device.
    // Prevents unauthorized access even with valid password.
    devices: [
      {
        deviceId: { 
          type: String, 
          required: true     // Unique device identifier (phone, tablet, computer)
        },
        deviceName: { 
          type: String       // Human-readable name (iPhone 13, Samsung Galaxy, etc.)
        },
        verified: { 
          type: Boolean, 
          default: false     // Must be approved by admin
        },
        registeredAt: { 
          type: Date, 
          default: Date.now  // When device was first registered
        },
        verifiedAt: {
          type: Date         // When admin approved this device
        },
      },
    ],

    // ────────────────────────────────────────────────────────────────────────
    // STUDENT/PARENT RELATIONSHIPS
    // ────────────────────────────────────────────────────────────────────────
    
    // For student accounts: reference to their academic profile
    studentProfile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Student' 
    },

    // For parent accounts: list of linked student IDs
    children: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Student' 
    }],

    // Account Status
    isActive: { 
      type: Boolean, 
      default: true         // Inactive users cannot log in
    },
    // Refresh tokens for session renewal (rotating refresh tokens)
    refreshTokens: [
      {
        token: { type: String },
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { 
    timestamps: true        // Adds createdAt and updatedAt fields
  }
);

/**
 * Hash Plain-Text Password
 * 
 * Static method to hash a password using SHA-512.
 * Called during user creation and password updates.
 * 
 * Security Note:
 * - SHA-512 used per project requirements
 * - In production, consider bcrypt or Argon2 for stronger security
 * 
 * @static
 * @param {string} password - Plain-text password
 * @returns {string} SHA-512 hash as hex string
 */
userSchema.statics.hashPassword = function (password) {
  return crypto.createHash('sha512').update(password).digest('hex');
};

/**
 * Verify Password
 * 
 * Instance method to verify a plain-text password against stored hash.
 * Used during login authentication.
 * 
 * @instance
 * @param {string} password - Plain-text password to verify
 * @returns {boolean} True if password matches hash, false otherwise
 */
userSchema.methods.verifyPassword = function (password) {
  const hash = crypto.createHash('sha512').update(password).digest('hex');
  return hash === this.passwordHash;
};

/**
 * Check Device Verification Status
 * 
 * Instance method to verify if a specific device is approved.
 * Critical security check before granting access.
 * 
 * @instance
 * @param {string} deviceId - Device ID to check
 * @returns {boolean} True if device is verified and approved
 */
userSchema.methods.isDeviceVerified = function (deviceId) {
  const device = this.devices.find((d) => d.deviceId === deviceId);
  return device ? device.verified : false;
};

module.exports = mongoose.model('User', userSchema);
