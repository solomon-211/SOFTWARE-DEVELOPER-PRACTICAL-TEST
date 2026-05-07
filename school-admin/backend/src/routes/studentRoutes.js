const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllStudents, getStudent, createStudent, updateStudent,
  updateGrades, markAttendance, bulkMarkAttendance, promoteStudents,
  linkUserAccount, sendRegistrationInvite, getUnlinkedUsers,
} = require('../controllers/studentController');
const { protect, staffOnly, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();
router.use(protect, staffOnly);

// ── Static routes FIRST (before /:id to avoid conflicts) ─────────────────────

router.get('/',               getAllStudents);
router.get('/unlinked-users', getUnlinkedUsers);

// Bulk attendance — must be before /:id routes
router.post('/bulk-attendance',
  [
    body('classId').isMongoId().withMessage('Valid class ID required'),
    body('date').isISO8601().withMessage('Valid date required'),
    body('defaultStatus').isIn(['present', 'absent', 'late', 'excused'])
      .withMessage('defaultStatus must be present, absent, late, or excused'),
    body('overrides').optional().isArray(),
  ],
  validate, bulkMarkAttendance);

// Promote — must be before /:id routes
router.post('/promote', adminOnly,
  [
    body('fromClassId').isMongoId().withMessage('Valid fromClassId required'),
    body('toClassId').isMongoId().withMessage('Valid toClassId required'),
  ],
  validate, promoteStudents);

// Create student
router.post('/', adminOnly,
  [
    body('studentCode').trim().notEmpty(),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  validate, createStudent);

// ── Dynamic /:id routes AFTER static routes ───────────────────────────────────

router.get('/:id',  [param('id').isMongoId()], validate, getStudent);
router.put('/:id',  adminOnly,
  [
    param('id').isMongoId(),
    body().custom((value) => {
      const allowed = ['studentCode', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'class', 'feeBalance', 'isActive'];
      const keys = Object.keys(value || {});
      const invalid = keys.filter((k) => !allowed.includes(k));
      if (invalid.length) {
        throw new Error(`Invalid update field(s): ${invalid.join(', ')}`);
      }
      if (!keys.length) {
        throw new Error('At least one field must be provided for update');
      }
      return true;
    }),
    body('studentCode').optional().trim().notEmpty().isLength({ max: 50 }),
    body('firstName').optional().trim().notEmpty().isLength({ max: 100 }),
    body('lastName').optional().trim().notEmpty().isLength({ max: 100 }),
    body('dateOfBirth').optional({ nullable: true }).isISO8601().toDate(),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('class').optional({ nullable: true }).isMongoId(),
    body('feeBalance').optional().isFloat({ min: 0 }),
    body('isActive').optional().isBoolean().toBoolean(),
  ],
  validate, updateStudent);

router.patch('/:id/link-account', adminOnly,
  [param('id').isMongoId(), body('email').isEmail().normalizeEmail()],
  validate, linkUserAccount);

router.post('/:id/send-invite', adminOnly,
  [
    param('id').isMongoId(),
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['student', 'parent']),
  ],
  validate, sendRegistrationInvite);

router.put('/:id/grades',
  [
    param('id').isMongoId(),
    body('grades').isArray({ min: 1 }),
    body('grades.*.subject').notEmpty(),
    body('grades.*.score').isNumeric(),
    body('grades.*.grade').notEmpty(),
    body('grades.*.term').notEmpty(),
  ],
  validate, updateGrades);

router.put('/:id/attendance',
  [
    param('id').isMongoId(),
    body('records').isArray({ min: 1 }),
    body('records.*.date').isISO8601(),
    body('records.*.status').isIn(['present', 'absent', 'late', 'excused']),
  ],
  validate, markAttendance);

module.exports = router;
