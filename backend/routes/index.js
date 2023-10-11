const router = require('express').Router();

router.use('/parking', require('./parking.route'));
router.use('/sse', require('./sse.route'));

module.exports = router;
