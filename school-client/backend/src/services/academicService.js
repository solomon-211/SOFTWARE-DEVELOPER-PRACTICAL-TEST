const Student = require('../models/Student');
const Class = require('../models/Class');
const { toGrades, toAttendance, toStudentProfile } = require('../dtos/userDto');

/**
 * Get a student's grades.
 * @param {string} studentId
 * @returns {Array} grade DTOs
 */
const getGrades = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  return toGrades(student);
};

/**
 * Get a student's attendance records.
 * @param {string} studentId
 * @returns {Array} attendance DTOs
 */
const getAttendance = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  return toAttendance(student);
};

/**
 * Get the timetable for a student's class.
 * @param {string} studentId
 * @returns {Array} timetable entries
 */
const getTimetable = async (studentId) => {
  const student = await Student.findById(studentId).populate('class');
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  if (!student.class) return [];
  return student.class.timetable || [];
};

/**
 * Get a student's full profile.
 * @param {string} studentId
 * @returns {object} student profile DTO
 */
const getProfile = async (studentId) => {
  const student = await Student.findById(studentId).populate('class', 'name grade section');
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  return toStudentProfile(student);
};

module.exports = { getGrades, getAttendance, getTimetable, getProfile };
