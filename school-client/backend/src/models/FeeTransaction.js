const mongoose = require('mongoose');

/**
 * Fee transaction model — tracks deposits and withdrawals per student.
 */
const feeTransactionSchema = new mongoose.Schema(
  {
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    type:        { type: String, enum: ['deposit', 'withdrawal', 'charge'], required: true },
    amount:      { type: Number, required: true, min: 0.01 },
    description: { type: String, trim: true },
    // Payment proof — either a URL link or a base64-encoded file reference
    proof: {
      type:     { type: String, enum: ['link', 'file'], default: 'link' },
      value:    { type: String, trim: true }, // URL or filename
      mimeType: { type: String },             // e.g. application/pdf, image/jpeg
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: function () {
        // Deposits are auto-approved; withdrawals need admin approval
        return this.type === 'deposit' ? 'approved' : 'pending';
      },
    },
    balanceBefore: { type: Number },
    balanceAfter:  { type: Number },
    processedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    processedAt:   { type: Date },
    initiatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeeTransaction', feeTransactionSchema);
