const express = require('express');
const { body } = require('express-validator');
const LinkingRequest = require('../models/LinkingRequest');
const { protect, requireVerifiedDevice } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect, requireVerifiedDevice);

// Submit a linking request
router.post('/',
  [
    body('studentCode').trim().notEmpty().withMessage('Student code is required'),
    body('message').optional().trim().isLength({ max: 300 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { studentCode, message } = req.body;

      // Check for existing pending request
      const existing = await LinkingRequest.findOne({
        user: req.user._id, studentCode, status: 'pending',
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'You already have a pending request for this student code.' });
      }

      const request = await LinkingRequest.create({
        user: req.user._id, studentCode, message,
      });

      res.status(201).json({
        success: true,
        message: 'Linking request submitted. The admin will review it shortly.',
        data: { id: request._id, studentCode, status: request.status },
      });
    } catch (err) { next(err); }
  }
);

// Get my linking requests
router.get('/', async (req, res, next) => {
  try {
    const requests = await LinkingRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
});

module.exports = router;
