const { parkingService, stripeService } = require('../services');
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

  if (message) {
    return res.status(403).send('NOT_ENTERED');
  }

  res.send({
    status: 'success',
    body: { link, message },
  });
});

exports.webhook = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = await stripeService.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event && event.type === 'checkout.session.completed') {
    const checkoutSessionCompleted = event.data.object;
    parkingService.handlePaymentSuccess({ id: checkoutSessionCompleted.id });
    return res.send({ status: 'ok' });
  }
  res.status(401).send({ status: 'error' });
});

exports.generateDummyData = catchAsync(async (req, res) => {
  const { dummyData } = await parkingService.generateDummyData();

  res.send({ dummyData });
});

exports.analytics = catchAsync(async (req, res) => {
  const {
    dailyTotalRevenueTime,
    dailyTotalParkingTime,
    groupedByDay,
    weeklyCount,
    hourlyCount,
  } = await parkingService.analytics();

  res.send({
    dailyTotalRevenueTime,
    dailyTotalParkingTime,
    groupedByDay,
    hourlyCount,
    weeklyCount,
  });
});
