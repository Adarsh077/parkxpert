const router = require('express').Router();

const { sseController } = require('../controllers');

router.get('/subscribe', sseController.subscribe);

module.exports = router;
