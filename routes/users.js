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
router.post('/buy_lottery', authenticateToken,adminctrl.purchaseLotteryTickets)
router.post('/endLottery',authenticateToken,isAdmin,adminctrl.endLottery)
router.post('/drawWinners',authenticateToken,isAdmin,adminctrl.drawWinners)
router.post('/create-lottery',authenticateToken,isAdmin,adminctrl.createLotteryParams)

    

module.exports = router;