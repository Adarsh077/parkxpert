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
    const parkings = await this.model.find(filter);
    return parkings;
  }

  async findOne(filter) {
    const parking = await this.model.findOne(filter);
    return parking;
  }
}

module.exports = new ParkingDataLayer();
