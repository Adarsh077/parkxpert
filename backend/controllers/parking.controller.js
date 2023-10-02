const { validateWebhookSignature } = require('razorpay');
const { parkingService } = require('../services');
const { catchAsync } = require('../utils');

exports.createEntry = catchAsync(async (req, res) => {
  const { carId } = req.body;

  await parkingService.createEntry({ carId });

  res.send('OK');
});

exports.exitCar = catchAsync(async (req, res) => {
  const { carId } = req.body;

  const { link, message } = await parkingService.exitCar({
    carId,
  });

  res.send({
    status: 'success',
    body: { link, message },
  });
});

exports.webhook = catchAsync(async (req, res) => {
  validateWebhookSignature(
    req.body,
    req.headers['x-razorpay-signature'],
    process.env.RAZORPAY_WEBHOOK_SECRET
  );

  const { event, payload } = req.body;
  if (event === 'payment_link.paid') {
    parkingService.handlePaymentSuccess({
      id: payload.payment_link.entity.id,
    });
    return res.send({ status: 'ok' });
  }
  res.status(401).send({ status: 'error' });
});
