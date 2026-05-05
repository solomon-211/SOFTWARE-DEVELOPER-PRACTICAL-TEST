const express = require('express');
const { getStats } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, adminOnly, getStats);

module.exports = router;
