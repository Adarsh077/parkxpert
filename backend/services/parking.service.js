const { DateTime } = require('luxon');

const { parkingDataLayer } = require('../data');
const iotService = require('./iot.service');
const sseService = require('./sse.service');
const stripeService = require('./stripe.service');

class ParkingService {
  constructor() {
    this.parkingDataLayer = parkingDataLayer;
  }

  async createEntry({ carId }) {
    const parking = await this.parkingDataLayer.findOne({
      carId,
      paymentStatus: {
        $ne: 'paid',
      },
    });

    if (parking) {
      return true;
    }

    await this.parkingDataLayer.create({
      carId,
      entryTimestamp: Date.now(),
    });

    return true;
  }

  async exitCar(data) {
    const { carId } = data;

    const parking = await this.parkingDataLayer.findOne({
      carId,
      paymentStatus: {
        $ne: 'paid',
      },
    });

    if (!parking) {
      return { message: 'Car did not make an entry' };
    }

    let totalAmount = parking.amount;

    if (totalAmount <= 0) {
      // TODO: should come from db
      const amountPerMinute = 10;

      const entryTimestamp = DateTime.fromJSDate(parking.entryTimestamp);
      const exitTimestamp = DateTime.fromJSDate(
        parking.exitTimestamp || new Date()
      );

      const minutesParked = Math.round(
        exitTimestamp.diff(entryTimestamp).as('minutes')
      );

      totalAmount = minutesParked * amountPerMinute;

      if (!totalAmount) {
        totalAmount = amountPerMinute;
      }

      await this.parkingDataLayer.updateOne(parking._id, {
        exitTimestamp: exitTimestamp.toJSDate(),
        amount: totalAmount,
      });
    }

    if (parking.paymentId) {
      const paymentResponse = await stripeService.getPaymentLinkDetails({
        id: parking.paymentId,
      });

      if (paymentResponse) {
        const { link, status } = paymentResponse;
        if (status === 'paid') {
          iotService.openExitBarricate();
          return { link: 'NOT_NEEDED' };
        }

        sseService.sendEvent({ data: { url: link } });

        return { link };
      }
    }

    const { link, id } = await stripeService.createPaymentLink({
      amount: totalAmount,
    });

    await this.parkingDataLayer.updateOne(parking._id, {
      paymentId: id,
    });

    sseService.sendEvent({ data: { url: link } });

    return { link };
  }

  async handlePaymentSuccess({ id }) {
    const paymentResponse = await stripeService.getPaymentLinkDetails({
      id: id,
    });

    if (paymentResponse && paymentResponse.status === 'paid') {
      const parking = await this.parkingDataLayer.findOne({
        paymentId: id,
      });

      if (!parking) return;

      await this.parkingDataLayer.updateOne(parking._id, {
        paymentStatus: 'paid',
      });

      iotService.openExitBarricate();
    }
  }
}

module.exports = new ParkingService();
