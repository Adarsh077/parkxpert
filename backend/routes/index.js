const router = require('express').Router();

router.use('/parking', require('./parking.route'));

module.exports = router;
