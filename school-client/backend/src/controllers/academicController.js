const academicService = require('../services/academicService');

/**
 * GET /api/academic/:studentId/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const data = await academicService.getProfile(req.params.studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/academic/:studentId/grades
 */
const getGrades = async (req, res, next) => {
  try {
    const data = await academicService.getGrades(req.params.studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/academic/:studentId/attendance
 */
const getAttendance = async (req, res, next) => {
  try {
    const data = await academicService.getAttendance(req.params.studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/academic/:studentId/timetable
 */
const getTimetable = async (req, res, next) => {
  try {
    const data = await academicService.getTimetable(req.params.studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, getGrades, getAttendance, getTimetable };
