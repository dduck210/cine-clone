const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const ctrl = require('../../controllers/payment/momo-controller');

router.post('/create', protect, ctrl.createPayment);
router.post('/ipn', ctrl.handleIPN);
router.get('/status/:bookingId', protect, ctrl.getStatus);
router.post('/confirm', protect, ctrl.confirm);
router.post('/confirm-demo/:bookingId', protect, ctrl.confirmDemo);

module.exports = router;
