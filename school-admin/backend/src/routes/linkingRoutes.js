const express = require('express');
const { param, body } = require('express-validator');
const LinkingRequest = require('../models/LinkingRequest');
const Student        = require('../models/Student');
const ClientUser     = require('../models/ClientUser');
const { protect, adminOnly } = require('../middlewares/auth');
const { notify }     = require('../services/emailService');
const validate       = require('../middlewares/validate');

const router = express.Router();
router.use(protect, adminOnly);

// GET all pending linking requests
router.get('/', async (req, res, next) => {
  try {
    const requests = await LinkingRequest.find({ status: 'pending' })
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
});

// PATCH approve or reject
router.patch('/:id',
  [param('id').isMongoId(), body('action').isIn(['approve', 'reject'])],
  validate,
  async (req, res, next) => {
    try {
      const request = await LinkingRequest.findById(req.params.id)
        .populate('user', 'firstName lastName email role');

      if (!request || request.status !== 'pending') {
        return res.status(404).json({ success: false, message: 'Request not found or already processed' });
      }

      if (req.body.action === 'approve') {
        const student = await Student.findOne({ studentCode: request.studentCode });
        if (!student) {
          return res.status(404).json({ success: false, message: `No student found with code: ${request.studentCode}` });
        }

        const user = await ClientUser.findById(request.user._id);

        // Link student to user
        student.userId = user._id;
        if (user.role === 'student') {
          user.studentProfile = student._id;
        } else {
          if (!user.children.map(String).includes(String(student._id))) {
            user.children.push(student._id);
          }
        }

        await Promise.all([student.save(), user.save()]);

        // Notify user
        try {
          await notify.linkingApproved(user, `${student.firstName} ${student.lastName}`);
        } catch (e) { console.error('Email error:', e.message); }

        request.status     = 'approved';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        await request.save();

        return res.json({ success: true, message: 'Request approved and account linked.' });
      } else {
        request.status     = 'rejected';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        await request.save();
        return res.json({ success: true, message: 'Request rejected.' });
      }
    } catch (err) { next(err); }
  }
);

module.exports = router;
