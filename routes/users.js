const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/checkRegisterd');
const { isAdmin } = require('../middlewares/isAdmin');
const User = require('../models/user'); // import the User model
const Lottery = require('../models/lottery'); // import the Lottery model
const PasswordResetToken = require('../models/PasswordResetToken'); // import the PasswordResetToken model
const LotteryParams=require('../models/lotteryparams')
const adminctrl=require('../controllers/adminctrl')
/* GET users listing. */
const MAX_LOTTERY_NUMBERS = 500;
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
/**
 * @swagger
 * /buy_lottery:
 *   post:
 *     summary: Purchase lottery tickets
 *     description: Purchase lottery tickets and assign them to the user
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lottery
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Purchase details
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             wallet_address:
 *               type: string
 *               description: Wallet address of the user
 *             lottery_number:
 *               type: integer
 *               description: Number of lottery tickets to purchase
 *     responses:
 *       200:
 *         description: Successful purchase of lottery tickets
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               description: Success message
 *             soldCount:
 *               type: integer
 *               description: Total count of sold lottery tickets for the user
 *             unsoldCount:
 *               type: integer
 *               description: Total count of unsold lottery tickets available
 *       400:
 *         description: Invalid input parameters or not enough unsold tickets available
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */

router.post('/buy_lottery', authenticateToken,adminctrl.purchaseLotteryTickets)


/**
 * @swagger
 * /draw:
 *   post:
 *     summary: Draw lottery winners
 *     description: Draws random lottery winners based on provided parameters
 *     tags:
 *       - Lottery
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: lotteryParams
 *         description: Parameters for drawing lottery winners
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *               description: Start date and time of the lottery
 *             endDate:
 *               type: string
 *               format: date-time
 *               description: End date and time of the lottery
 *             prize:
 *               type: string
 *               description: Prize for the winners
 *             randomCount:
 *               type: integer
 *               description: Number of random lottery numbers to select
 *             winnersCount:
 *               type: integer
 *               description: Number of winners to select
 *           example:
 *             startDate: '2023-05-23T00:00:00Z'
 *             endDate: '2023-05-24T13:30:00Z'
 *             prize: '5000'
 *             randomCount: 10
 *             winnersCount: 3
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 winners:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: List of winning lottery numbers
 *                   example: [42, 17, 93]
 *       400:
 *         description: Invalid input parameters or lottery not available
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */




router.post('/draw', authenticateToken, isAdmin,adminctrl.startLotteryDraw)
/*async (req, res) => {
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
});*/

    

module.exports = router;