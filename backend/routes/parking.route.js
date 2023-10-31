const router = require('express').Router();

const { parkingController } = require('../controllers');

router.route('/entry').post(parkingController.createEntry);
router.route('/exit').post(parkingController.exitCar);
// router.route('/generateDummyData').post(parkingController.generateDummyData);
router.route('/analytics').post(parkingController.analytics);

module.exports = router;
