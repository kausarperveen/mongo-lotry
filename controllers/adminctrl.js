const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/checkRegisterd');
const { isAdmin } = require('../middlewares/isAdmin');
const User = require('../models/user'); // import the User model
const Lottery = require('../models/lottery'); // import the Lottery model
const PasswordResetToken = require('../models/PasswordResetToken'); // import the PasswordResetToken model
const LotteryParams=require('../models/lotteryparams')



async function purchaseLotteryTickets(req, res) {
  try {
    const { wallet_address, lottery_number } = req.body;
    const user_id = req.user && req.user._id;

    if (!user_id) {
      return res.status(401).send('Unauthorized');
    }

    const lotteryUser = await Lottery.findOneAndUpdate(
      { wallet_address },
      { $set: { user_id } },
      { upsert: true, new: true }
    );

    if (!lotteryUser) {
      return res.status(400).send('Invalid wallet address');
    }

    const lotteryParams = await LotteryParams.findOne();

    if (!lotteryParams) {
      return res.status(400).send('Lottery parameters not found');
    }

    const soldTickets = await Lottery.countDocuments({ user_id });

    const numLotteryNumbers = Math.min(lottery_number, lotteryParams.maxTicketsPerUser);

    if (numLotteryNumbers <= 0) {
      return res.status(400).send('Invalid number of lottery tickets');
    }

    const userSoldTickets = await Lottery.countDocuments({
      user_id,
      sold: true
    });

    if (userSoldTickets + numLotteryNumbers > lotteryParams.maxTicketsPerUser) {
      return res.status(400).send('Exceeded maximum number of tickets per user');
    }

    const unsoldTickets = lotteryParams.totalTickets - soldTickets;

    if (unsoldTickets < numLotteryNumbers) {
      return res.status(400).send('Not enough unsold tickets available');
    }

    // Generate unique random lottery numbers within the desired range
    const lotteryNumbers = [];
    const unsoldTicketsData = [];
    const unsoldRange = Array.from({ length: unsoldTickets }, (_, i) => i + 1);

    while (lotteryNumbers.length < numLotteryNumbers) {
      const randomIndex = Math.floor(Math.random() * unsoldRange.length);
      const selectedNumber = unsoldRange.splice(randomIndex, 1)[0];
      lotteryNumbers.push(selectedNumber);
      unsoldTicketsData.push({
        user_id,
        lottery_number: selectedNumber,
        purchase_date: new Date(),
        wallet_address,
        sold: true
      });
    }

    // Save the unsold tickets to the database
    await Lottery.insertMany(unsoldTicketsData);

    // Remove the additional document
    await Lottery.deleteOne({ lottery_number: null });

    const soldCount = soldTickets + numLotteryNumbers;
    const unsoldCount = unsoldTickets - numLotteryNumbers;

    return res.status(200).json({
      message: 'Lottery tickets purchased successfully',
      soldCount,
      unsoldCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
}



async function endLottery(req, res) {
  try {
    const lotteryParams = await LotteryParams.findOne();
    const endDate = lotteryParams.endDate;

    if (!endDate) {
      return res.status(400).send('Invalid input parameters');
    }

    const currentTime = new Date();
    const endDateTime = new Date(endDate);

    if (currentTime > endDateTime) {
      return res.status(400).send('Lottery has already ended');
    }

    const totalTickets = lotteryParams.totalTickets;

    const unsoldTickets = await Lottery.countDocuments({ sold: false });
    const soldTickets = totalTickets - unsoldTickets;

    // Update the sold and unsold counts in the lotteryParams document
    lotteryParams.soldCount = soldTickets;
    lotteryParams.unsoldCount = unsoldTickets;
    await lotteryParams.save();

    return res.status(200).send('Lottery ended successfully');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
}

async function drawWinners(req, res) {
  try {
    const lotteryParams = await LotteryParams.findOne();
    const numberOfWinners = lotteryParams.numberOfWinners;

    if (!numberOfWinners) {
      return res.status(400).send('Invalid input parameters');
    }

    const soldTickets = await Lottery.countDocuments({ sold: true });

    const unsoldTickets = lotteryParams.totalTickets - soldTickets;

    if (unsoldTickets < numberOfWinners) {
      return res.status(400).send('Not enough unsold tickets available');
    }

    const winners = [];
    const unsoldRange = Array.from({ length: unsoldTickets }, (_, i) => i + 1);

    while (winners.length < numberOfWinners) {
      const randomIndex = Math.floor(Math.random() * unsoldRange.length);
      const selectedNumber = unsoldRange.splice(randomIndex, 1)[0];
      winners.push(selectedNumber);
    }

    return res.status(200).json({
      winners: winners,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
}
async function createLotteryParams(req, res) {
  try {
    const {
      startDate,
      endDate,
      totalTickets,
      maxTicketsPerUser,
      ticketPrice,
      numberOfWinners,
      prize
    } = req.body;

    // Check if the lottery params already exist
    let lotteryParams = await LotteryParams.findOne();

    if (lotteryParams) {
      // Update the existing lottery params
      lotteryParams.startDate = startDate;
      lotteryParams.endDate = endDate;
      lotteryParams.totalTickets = totalTickets;
      lotteryParams.maxTicketsPerUser = maxTicketsPerUser;
      lotteryParams.ticketPrice = ticketPrice;
      lotteryParams.numberOfWinners = numberOfWinners;
      lotteryParams.prize = prize;
      lotteryParams.unsold = Array.from({ length: totalTickets }, (_, index) => index + 1);
    } else {
      // Create a new lottery params object
      lotteryParams = new LotteryParams({
        startDate,
        endDate,
        totalTickets,
        maxTicketsPerUser,
        ticketPrice,
        numberOfWinners,
        prize,
        unsold: Array.from({ length: totalTickets }, (_, index) => index + 1)
      });
    }

    // Save or update the lottery params object
    await lotteryParams.save();

    return res.status(200).json({ message: 'Lottery created/updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while creating/updating the lottery' });
  }
}



  module.exports={purchaseLotteryTickets,endLottery,createLotteryParams,drawWinners}