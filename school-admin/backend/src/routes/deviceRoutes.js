const express = require('express');
const { getPendingDevices, getAllUsers, verifyDevice, revokeDevice } = require('../services/deviceService');
const { protect, adminOnly } = require('../middlewares/auth');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/pending',                    async (req, res, next) => {
  try { res.json({ success: true, data: await getPendingDevices() }); } catch(e) { next(e); }
});

router.get('/users',                      async (req, res, next) => {
  try { res.json({ success: true, data: await getAllUsers() }); } catch(e) { next(e); }
});

router.patch('/:userId/:deviceId/verify', async (req, res, next) => {
  try {
    const data = await verifyDevice(req.params.userId, req.params.deviceId, req.user._id);
    res.json({ success: true, message: 'Device verified', data });
  } catch(e) { next(e); }
});

router.patch('/:userId/:deviceId/revoke', async (req, res, next) => {
  try {
    const data = await revokeDevice(req.params.userId, req.params.deviceId);
    res.json({ success: true, message: 'Device revoked', data });
  } catch(e) { next(e); }
});

module.exports = router;
