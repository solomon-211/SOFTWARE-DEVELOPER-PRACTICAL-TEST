const mongoose = require('mongoose');

const feeTransactionSchema = new mongoose.Schema(
  {
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    type:        { type: String, enum: ['deposit', 'withdrawal'], required: true },
    amount:      { type: Number, required: true, min: 0.01 },
    description: { type: String, trim: true },
    proof: {
      type:     { type: String, enum: ['link', 'file'], default: 'link' },
      value:    { type: String, trim: true },
      mimeType: { type: String },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    balanceBefore: { type: Number },
    balanceAfter:  { type: Number },
    processedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    processedAt:   { type: Date },
    initiatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'ClientUser' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeeTransaction', feeTransactionSchema);
