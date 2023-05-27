const mongoose = require('mongoose');

const lotteryParamsSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
    get: function (value) {
      return value.toISOString(); // Convert to UTC timestamp
    },
    set: function (value) {
      return new Date(value); // Parse UTC timestamp to Date object
    }
  },
  endDate: {
    type: Date,
    required: true,
    get: function (value) {
      return value.toISOString(); // Convert to UTC timestamp
    },
    set: function (value) {
      return new Date(value); // Parse UTC timestamp to Date object
    }
  },
  prize: {
    type: String,
    required: true
  },
  randomCount: {
    type: Number,
    required: true
  },
  maxTicketsPerUser: {
    type: Number,
    required: true
  }
}, {
  collection: 'lotteryParams',
  timestamps: true
});

const LotteryParams = mongoose.model('LotteryParams', lotteryParamsSchema);

module.exports = LotteryParams;
