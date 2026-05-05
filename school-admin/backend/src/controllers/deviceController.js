const deviceService = require('../services/deviceService');

const getPendingDevices = async (req, res, next) => {
  try {
    const data = await deviceService.getPendingDevices();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const verifyDevice = async (req, res, next) => {
  try {
    const { userId, deviceId } = req.params;
    const data = await deviceService.verifyDevice(userId, deviceId, req.user._id);
    res.json({ success: true, message: 'Device verified successfully', data });
  } catch (err) {
    next(err);
  }
};

const revokeDevice = async (req, res, next) => {
  try {
    const { userId, deviceId } = req.params;
    const data = await deviceService.revokeDevice(userId, deviceId);
    res.json({ success: true, message: 'Device revoked', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPendingDevices, verifyDevice, revokeDevice };
