const mongoose = require('mongoose');

/**
 * Class model — shared reference used by both client and admin backends.
 * The admin backend is the source of truth; this model mirrors relevant data
 * including the teacher assigned to each timetable slot.
 */
const classSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    grade:     { type: String },  // optional — admin may not set a grade
    section:   { type: String },
    timetable: [
      {
        day:       { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
        subject:   { type: String },
        startTime: { type: String },
        endTime:   { type: String },
        room:      { type: String },
        // Teacher assigned to this specific slot — populated from AdminUser
        teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
      },
    ],
    academicYear: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }  // strict: false allows extra fields from admin backend
);

module.exports = mongoose.model('Class', classSchema);
