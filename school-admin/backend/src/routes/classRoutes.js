const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllClasses, getClass, createClass, updateClass,
  assignTeacher, removeTeacher, updateTimetable, getTeachers,
} = require('../controllers/classController');
const { protect, adminOnly, staffOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.get('/',           staffOnly, getAllClasses);
router.get('/teachers',   staffOnly, getTeachers);
router.get('/:id',        staffOnly, [param('id').isMongoId()], validate, getClass);

router.post('/',          adminOnly, [body('name').trim().notEmpty()], validate, createClass);
router.put('/:id',        adminOnly, [param('id').isMongoId()], validate, updateClass);

// Assign a teacher to a subject in this class
router.patch(
  '/:id/assign-teacher',
  adminOnly,
  [
    param('id').isMongoId(),
    body('teacherId').isMongoId().withMessage('Valid teacher ID required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
  ],
  validate,
  assignTeacher
);

// Remove a teacher from a subject
router.patch(
  '/:id/remove-teacher',
  adminOnly,
  [
    param('id').isMongoId(),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
  ],
  validate,
  removeTeacher
);

router.put(
  '/:id/timetable',
  adminOnly,
  [param('id').isMongoId(), body('timetable').isArray()],
  validate,
  updateTimetable
);

module.exports = router;
