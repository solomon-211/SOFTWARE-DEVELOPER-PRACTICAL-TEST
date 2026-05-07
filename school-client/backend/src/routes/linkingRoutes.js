const express = require('express');
const { body, param } = require('express-validator');
const LinkingRequest = require('../models/LinkingRequest');
const Student = require('../models/Student');
const { protect, requireVerifiedDevice } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { toLinkingRequest } = require('../dtos/userDto');

const router = express.Router();

router.use(protect, requireVerifiedDevice);

const normalizeStudentCode = (studentCode) => studentCode.trim().toUpperCase();

router.post('/',
  [
    body('studentCode').trim().notEmpty().withMessage('Student code is required'),
    body('message').optional().trim().isLength({ max: 300 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const studentCode = normalizeStudentCode(req.body.studentCode);
      const { message } = req.body;

      const student = await Student.findOne({ studentCode });
      if (!student) {
        return res.status(404).json({ success: false, message: `No student found with code: ${studentCode}` });
      }

      const existing = await LinkingRequest.findOne({
        user: req.user._id,
        studentCode,
        status: 'pending',
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'You already have a pending request for this student code.' });
      }

      if (student.userId && String(student.userId) !== String(req.user._id)) {
        return res.status(409).json({ success: false, message: 'This student is already linked to another account.' });
      }

      const request = await LinkingRequest.create({
        user: req.user._id,
        student: student._id,
        studentCode,
        message,
      });

      res.status(201).json({
        success: true,
        message: 'Linking request submitted. The admin will review it shortly.',
        data: toLinkingRequest(request),
      });
    } catch (err) { next(err); }
  }
);

router.get('/', async (req, res, next) => {
  try {
    const requests = await LinkingRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: requests.map(toLinkingRequest) });
  } catch (err) { next(err); }
});

router.get('/:studentCode',
  [param('studentCode').trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const studentCode = normalizeStudentCode(req.params.studentCode);
      const request = await LinkingRequest.findOne({ user: req.user._id, studentCode });

      if (!request) {
        return res.json({ success: true, data: null });
      }

      return res.json({ success: true, data: toLinkingRequest(request) });
    } catch (err) { next(err); }
  }
);

module.exports = router;
