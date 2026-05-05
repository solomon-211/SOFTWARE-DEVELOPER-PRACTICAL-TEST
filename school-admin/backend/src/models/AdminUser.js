/**
 * ============================================================================
 * ADMINUSER MODEL
 * ============================================================================
 * 
 * Mongoose schema for admin and staff accounts.
 * 
 * Roles:
 * - admin: Full system access (user management, finance, reporting)
 * - teacher: Limited access (grades, attendance, class roster)
 * 
 * Security:
 * - Passwords stored as SHA-512 hashes (never plain text)
 * - Static method for hashing new passwords
 * - Instance method for password verification during login
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Admin User Schema
 * 
 * Represents admin and staff members in the system.
 * Supports role-based access control.
 */
const adminUserSchema = new mongoose.Schema(
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

    // Password Security
    passwordHash: { 
      type: String, 
      required: true     // SHA-512 hash, never plain text
    },

    // Access Control
    role: {
      type: String,
      enum: ['admin', 'teacher'],
      default: 'teacher',
    },

    // Teacher-specific: Which classes they teach
    assignedClasses: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Class' 
    }],

    // Account Status
    isActive: { 
      type: Boolean, 
      default: true      // Inactive users cannot log in
    },
  },
  { 
    timestamps: true    // Adds createdAt and updatedAt fields
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
adminUserSchema.statics.hashPassword = function (password) {
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
adminUserSchema.methods.verifyPassword = function (password) {
  const hash = crypto.createHash('sha512').update(password).digest('hex');
  return hash === this.passwordHash;
};

module.exports = mongoose.model('AdminUser', adminUserSchema);
