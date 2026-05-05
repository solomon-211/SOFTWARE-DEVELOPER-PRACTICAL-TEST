const mongoose = require('mongoose');

/**
 * Student academic profile model.
 */
const studentSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentCode: { type: String, unique: true, required: true },
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender:      { type: String, enum: ['male', 'female', 'other'] },
    class:       { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    // Fee account
    feeBalance:  { type: Number, default: 0 },
    // Academic records
    grades: [
      {
        subject:   { type: String },
        score:     { type: Number },
        grade:     { type: String },
        term:      { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    attendance: [
      {
        date:      { type: Date },
        status:    { type: String, enum: ['present', 'absent', 'late', 'excused'] },
        markedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
