const mongoose = require('mongoose');

/**
 * Class model — shared reference used by both client and admin backends.
 * The admin backend is the source of truth; this model mirrors relevant data.
 */
const classSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    grade:     { type: String, required: true },
    section:   { type: String },
    teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    timetable: [
      {
        day:     { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
        subject: { type: String },
        startTime: { type: String },
        endTime:   { type: String },
        room:      { type: String },
      },
    ],
    academicYear: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
