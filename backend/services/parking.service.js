/* eslint-disable no-restricted-syntax */
const moment = require('moment');
const { DateTime } = require('luxon');
const _ = require('lodash');

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

  async generateDummyData() {
    const { dummyData } = await parkingDataLayer.generateDummyData();
    return { dummyData };
  }

  async analytics() {
    const parkings = await parkingDataLayer.find();

    const groupedByWeek = _.groupBy(parkings, (parking) => {
      return `Week ${moment(parking.entryTimestamp).week()}`;
    });

    const weeklyCount = [];
    for (const groupKey of Object.keys(groupedByWeek)) {
      weeklyCount.push({
        label: groupKey,
        value: groupedByWeek[groupKey].length,
      });
    }

    const groupedByHour = _.groupBy(
      parkings.filter(
        (parking) =>
          new Date(parking.entryTimestamp) >
          moment().subtract(4, 'hours').toDate()
      ),
      (parking) => {
        return moment(new Date(parking.entryTimestamp)).local().format('HH:00');
      }
    );

    const hourlyCount = [];
    for (const groupKey of Object.keys(groupedByHour)) {
      hourlyCount.push({
        label: groupKey,
        value: groupedByHour[groupKey].length,
      });
    }

    const groupedByDay = _.groupBy(parkings, (parking) => {
      return `${moment(parking.entryTimestamp).date()}/${
        moment(parking.entryTimestamp).month() + 1
      }`;
    });

    const dailyTotalParkingTime = Object.keys(groupedByDay).map((day) => {
      const parkingsOfTheDay = groupedByDay[day];

      let sumOfParkingTime = 0;

      for (const parking of parkingsOfTheDay) {
        parking.exitTimestamp = parking.exitTimestamp || moment().toDate();
        const minutesDifference = moment(parking.exitTimestamp).diff(
          parking.entryTimestamp,
          'minutes'
        );

        sumOfParkingTime += minutesDifference;
      }

      return {
        label: day,
        value: sumOfParkingTime > 0 ? sumOfParkingTime : 0,
      };
    });

    const dailyTotalRevenueTime = Object.keys(groupedByDay).map((day) => {
      const parkingsOfTheDay = groupedByDay[day];

      let sumOfParkingRevenue = 0;

      for (const parking of parkingsOfTheDay) {
        // eslint-disable-next-line no-continue
        if (!parking.amount) continue;

        sumOfParkingRevenue += parking.amount;
      }

      return {
        label: day,
        value: sumOfParkingRevenue > 0 ? sumOfParkingRevenue : 0,
      };
    });

    return {
      dailyTotalRevenueTime: dailyTotalRevenueTime.slice(-4),
      dailyTotalParkingTime: dailyTotalParkingTime.slice(-4),
      hourlyCount,
      weeklyCount,
    };
  }
}

module.exports = new ParkingService();
