const express = require('express');
const { body, param } = require('express-validator');
const { getAllTransactions, processTransaction, getFeeStats } = require('../controllers/feeController');
const { protect, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/',      getAllTransactions);
router.get('/stats', getFeeStats);

router.patch(
  '/:txId/process',
  [
    param('txId').isMongoId(),
    body('action').isIn(['approve', 'reject']),
  ],
  validate,
  processTransaction
);

module.exports = router;
