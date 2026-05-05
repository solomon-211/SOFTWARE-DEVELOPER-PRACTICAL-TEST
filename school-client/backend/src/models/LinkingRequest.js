const mongoose = require('mongoose');

/**
 * A parent submits a request to link their account to a student
 * using the student's code. Admin approves or rejects.
 */
const linkingRequestSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentCode: { type: String, required: true, trim: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  message:     { type: String, trim: true }, // optional note from parent
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  reviewedAt:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('LinkingRequest', linkingRequestSchema);
