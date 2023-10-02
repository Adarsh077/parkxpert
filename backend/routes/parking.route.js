const router = require('express').Router();

const { parkingController } = require('../controllers');

router.route('/entry').post(parkingController.createEntry);
router.route('/exit').post(parkingController.exitCar);

module.exports = router;
