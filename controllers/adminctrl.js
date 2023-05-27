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

    const maxLotteryNumber = await Lottery.findOne().sort({ lottery_number: -1 }).limit(1);
    const nextLotteryNumber = (maxLotteryNumber?.lottery_number || 0) + 1;
    const numLotteryNumbers = Math.min(lottery_number, 1000);

    if (numLotteryNumbers <= 0) {
      return res.status(400).send('Invalid number of lottery tickets');
    }

    if (numLotteryNumbers > 1000) {
      return res.status(400).send('Exceeded maximum number of lottery tickets');
    }

    const soldTickets = await Lottery.countDocuments({ user_id });
    const unsoldTickets = 1000 - soldTickets - numLotteryNumbers;

    if (unsoldTickets < 0) {
      return res.status(400).send('Not enough unsold tickets available');
    }

    // Generate unique random lottery numbers within the desired range
    const lotteryNumbers = [];
    const unsoldTicketsData = [];
    const unsoldRange = Array.from({ length: 1000 }, (_, i) => i + 1);

    while (lotteryNumbers.length < numLotteryNumbers) {
      const randomIndex = Math.floor(Math.random() * unsoldRange.length);
      const selectedNumber = unsoldRange.splice(randomIndex, 1)[0];
      lotteryNumbers.push(selectedNumber);
      unsoldTicketsData.push({
        user_id,
        lottery_number: selectedNumber,
        purchase_date: new Date(),
        wallet_address,
      });
    }

    // Save the unsold tickets to the database
    await Lottery.insertMany(unsoldTicketsData);

    // Remove the additional document
    await Lottery.deleteOne({ lottery_number: null });

    const soldCount = soldTickets + numLotteryNumbers;
    const unsoldCount = unsoldTickets;

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


async function startLotteryDraw(req, res) {
    try {
      const { startDate, endDate, prize, randomCount, winnersCount, maxTicketsPerUser } = req.body;
  
      if (!startDate || !endDate || !prize || !randomCount || !winnersCount || !maxTicketsPerUser) {
        return res.status(400).send('Invalid input parameters');
      }
  
      const currentTime = new Date();
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
  
      if (currentTime < startDateTime) {
        return res.status(400).send('Lottery has not started yet');
      }
  
      if (currentTime > endDateTime) {
        return res.status(400).send('Lottery has already ended');
      }
  
      const soldTickets = await Lottery.countDocuments({});
      const unsoldTickets = 1000 - soldTickets;
  
      if (unsoldTickets < randomCount) {
        return res.status(400).send('Not enough unsold tickets available');
      }
  
      const unsoldRange = Array.from({ length: 1000 }, (_, i) => i + 1);
      const randomNumbers = [];
  
      while (randomNumbers.length < randomCount) {
        const randomIndex = Math.floor(Math.random() * unsoldRange.length);
        const selectedNumber = unsoldRange.splice(randomIndex, 1)[0];
        randomNumbers.push(selectedNumber);
      }
  
      const winners = [];
      for (let i = 0; i < winnersCount; i++) {
        const winningIndex = Math.floor(Math.random() * randomNumbers.length);
        const winningNumber = randomNumbers[winningIndex];
        winners.push(winningNumber);
        randomNumbers.splice(winningIndex, 1);
      }
  
      const lotteryParams = new LotteryParams({
        startDate,
        endDate,
        prize,
        randomCount,
        maxTicketsPerUser
      });
  
      await lotteryParams.save();
  
      return res.status(200).json({
        winners,
        lotteryParams
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send('Internal server error');
    }
  }
  /*router.get('/generate_random_numbers', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user && req.user._id;

    if (!user_id) {
      return res.status(401).send('Unauthorized');
    }

    const soldTickets = await Lottery.countDocuments({ user_id });
    const unsoldTickets = 1000 - soldTickets;

    if (unsoldTickets < 5) {
      return res.status(400).send('Not enough unsold tickets available');
    }

    const unsoldRange = Array.from({ length: 1000 }, (_, i) => i + 1);
    const randomNumbers = [];

    while (randomNumbers.length < 5) {
      const randomIndex = Math.floor(Math.random() * unsoldRange.length);
      const selectedNumber = unsoldRange.splice(randomIndex, 1)[0];
      randomNumbers.push(selectedNumber);
    }

    return res.status(200).json({
      randomNumbers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
});*/
  module.exports={startLotteryDraw,purchaseLotteryTickets}