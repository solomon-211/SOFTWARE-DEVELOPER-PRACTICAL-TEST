const express = require('express');
const { param } = require('express-validator');
const { getProfile, getGrades, getAttendance, getTimetable } = require('../controllers/academicController');
const { protect, requireVerifiedDevice } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect, requireVerifiedDevice);

const studentIdParam = [param('studentId').isMongoId().withMessage('Invalid student ID')];

router.get('/:studentId/profile',    studentIdParam, validate, getProfile);
router.get('/:studentId/grades',     studentIdParam, validate, getGrades);
router.get('/:studentId/attendance', studentIdParam, validate, getAttendance);
router.get('/:studentId/timetable',  studentIdParam, validate, getTimetable);

module.exports = router;
