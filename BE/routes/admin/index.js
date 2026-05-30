const express = require('express');
const router = express.Router();

router.use('/', require('./users'));
router.use('/', require('./cinemas'));
router.use('/', require('./rooms'));
router.use('/', require('./emergency'));
router.use('/', require('./bookings'));
router.use('/', require('./showtimes'));
router.use('/', require('./notifications'));
router.use('/', require('./reports'));
router.use('/', require('./audit'));

module.exports = router;
