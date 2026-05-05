const mongoose = require('mongoose');

/**
 * Password reset token — expires after 1 hour.
 */
const passwordResetSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  userModel: { type: String, enum: ['User', 'AdminUser'], required: true },
  token:     { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete expired tokens
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
