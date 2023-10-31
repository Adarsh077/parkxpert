const { faker } = require('@faker-js/faker');
const moment = require('moment');

const { ParkingModel } = require('../models');

class ParkingDataLayer {
  constructor() {
    this.model = ParkingModel;
  }

  async create(data) {
    const { carId, entryTimestamp } = data;
    const parking = await this.model.create({ carId, entryTimestamp });
    return parking;
  }

  async updateOne(_id, data) {
    const { exitTimestamp, amount, paymentId, paymentStatus } = data;

    const updateObj = {};
    if (exitTimestamp) {
      updateObj.exitTimestamp = exitTimestamp;
    }
    if (amount) {
      updateObj.amount = amount;
    }
    if (paymentId) {
      updateObj.paymentId = paymentId;
    }
    if (paymentStatus) {
      updateObj.paymentStatus = paymentStatus;
    }

    const parking = await this.model.findByIdAndUpdate(_id, updateObj, {
      omitUndefined: true,
    });

    return parking;
  }

  async find(filter) {
    const parkings = await this.model.find(filter).sort('entryTimestamp');
    return parkings;
  }

  async findOne(filter) {
    const parking = await this.model.findOne(filter);
    return parking;
  }

  async generateDummyData() {
    const dummyData = [];

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 100; i++) {
      const entryTimestamp = faker.date.between({
        from: '2023-10-01',
        to: '2023-11-01',
      });
      const maxExitTimestamp = moment(entryTimestamp).add(2, 'days').toDate();

      const exitTimestamp = faker.date.between({
        from: entryTimestamp,
        to: maxExitTimestamp,
      });
      const minutesDifference = moment(exitTimestamp).diff(
        entryTimestamp,
        'minutes'
      );
      const amount =
        exitTimestamp > moment().toDate() ? 0 : minutesDifference * 10;
      const paymentId =
        exitTimestamp < moment().toDate() ? faker.string.uuid() : null;

      const paymentStatus =
        exitTimestamp < moment().toDate() &&
        exitTimestamp < moment().subtract(5, 'minutes').toDate()
          ? 'paid'
          : 'not_paid';

      dummyData.push({
        carId: faker.vehicle.vrm(),
        entryTimestamp,
        exitTimestamp: exitTimestamp > moment().toDate() ? null : exitTimestamp,
        amount,
        paymentId: paymentStatus === 'not_paid' ? null : paymentId,
        paymentStatus,
      });
    }

    await ParkingModel.insertMany(dummyData);
    console.log('Dummy data generated successfully.');
    return { dummyData };
  }
}

module.exports = new ParkingDataLayer();
