const mongoose = require('mongoose');

const ParkingSchema = mongoose.Schema(
  {
    carId: {
      type: String,
    },
    entryTimestamp: {
      type: Date,
      required: true,
    },
    exitTimestamp: {
      type: Date,
      default: null,
    },
    amount: {
      type: Number,
      default: 0,
    },
    paymentId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      default: 'not_paid',
    },
  },
  {
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
      },
    },
    timestamps: true,
  }
);

module.exports = mongoose.model('parkings', ParkingSchema);
