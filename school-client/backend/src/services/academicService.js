const Student = require('../models/Student');
const User    = require('../models/User');
const { toGrades, toAttendance, toStudentProfile } = require('../dtos/userDto');

// Helper: find student by record ID, by linked user account ID, or by user name match.
const findStudent = async (studentId, populateOptions) => {
  // 1. Try direct student record ID
  let query = Student.findById(studentId);
  if (populateOptions) query = query.populate(populateOptions);
  let student = await query;
  if (student) return student;

  // 2. Try finding by userId (student account linked via invite or auto-link)
  let q2 = Student.findOne({ userId: studentId });
  if (populateOptions) q2 = q2.populate(populateOptions);
  student = await q2;
  if (student) return student;

  // 3. Last resort: look up the user account and match student by name
  //    (handles admin-created students whose userId was never set)
  try {
    const user = await User.findById(studentId).select('firstName lastName role');
    if (user && user.role === 'student') {
      let q3 = Student.findOne({
        firstName: { $regex: new RegExp(`^${user.firstName}$`, 'i') },
        lastName:  { $regex: new RegExp(`^${user.lastName}$`, 'i') },
      });
      if (populateOptions) q3 = q3.populate(populateOptions);
      student = await q3;
      if (student && !student.userId) {
        // Opportunistically link so future lookups are faster
        student.userId = studentId;
        await student.save();
      }
    }
  } catch (_) { /* ignore lookup errors */ }

  return student || null;
};

const getGrades = async (studentId) => {
  const student = await findStudent(studentId);
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }
  return toGrades(student);
};

const getAttendance = async (studentId) => {
  const student = await findStudent(studentId);
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }
  return toAttendance(student);
};

/**
 * Get the timetable for a student's class.
 * Can look up by student record ID or by user account ID.
 */
const getTimetable = async (studentId) => {
  const populateOptions = {
    path:     'class',
    populate: {
      path:   'timetable.teacher',
      select: 'firstName lastName',
      model:  'AdminUser',
    },
  };
  const student = await findStudent(studentId, populateOptions);
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }
  if (!student.class) return [];

  return (student.class.timetable || []).map((slot) => ({
    day:       slot.day,
    subject:   slot.subject,
    startTime: slot.startTime,
    endTime:   slot.endTime,
    room:      slot.room || null,
    teacher:   slot.teacher && typeof slot.teacher === 'object' && slot.teacher.firstName
      ? { firstName: slot.teacher.firstName, lastName: slot.teacher.lastName }
      : null,
  }));
};

/**
 * Get a student's full profile.
 * @param {string} studentId
 * @returns {object} student profile DTO
 */
const getProfile = async (studentId) => {
  const student = await findStudent(studentId, { path: 'class', select: 'name grade section' });
  if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }
  return toStudentProfile(student);
};

module.exports = { getGrades, getAttendance, getTimetable, getProfile };
