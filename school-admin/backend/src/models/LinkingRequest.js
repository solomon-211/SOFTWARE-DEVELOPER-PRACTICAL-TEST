const mongoose = require('mongoose');

const linkingRequestSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'ClientUser', required: true },
  studentCode: { type: String, required: true, trim: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  message:     { type: String, trim: true },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  reviewedAt:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('LinkingRequest', linkingRequestSchema);
