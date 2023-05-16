const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user'); // import the User model
const Lottery = require('../models/lottery'); // import the Lottery model
const PasswordResetToken = require('../models/PasswordResetToken'); // import the PasswordResetToken model
// Routes that use the models go here 
var { signupValidators,loginValidators,resetPasswordValidators } = require('../inputvalidators/input')
var {generatePasswordResetToken,sendPasswordResetEmail}=require('../helper/adminhelper')
//sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { isAdmin } = require('../middlewares/isAdmin');
const { authenticateToken } = require('../middlewares/checkRegisterd')
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.use((req, res, next) => {
  if (req.method === 'POST') {
    // Handle the POST request here
    console.log('Received a POST request');
    // Perform necessary actions

    // Return a response
    res.send('POST request processed successfully');
  } else {
    next(); // Pass the request to the next middleware/route handler
  }
});
router.post('/signup', async (req, res) => {
  try {
    await signupValidators(req.body);
    const user = await User.create(req.body);
    res.json({ statusCode: 200, message: "User registered successfully", data: user });
  } catch (error) {
    console.error(error);
    res.status(error.code).json({ error: error.error });
  }
});
/**
 * @api {post} /login User login
 * @apiName UserLogin
 * @apiGroup Users
 *
 * @apiParam {String} email User's email address
 * @apiParam {String} password User's password
 *
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} token Authentication token
 * @apiSuccess {String} email User's email address
 */
// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const authResult = await loginValidators(email, password);

    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { token } = authResult;
    res.status(200).json({ message: "Login successful", token, email });
  } catch (error) {
    res.status(error.code || 500).json({ error: error.error || "Internal Server Error" });
  }
});
/**
 * @api {post} /forgot_password Request password reset
 * @apiName RequestPasswordReset
 * @apiGroup Users
 *
 * @apiParam {String} email User's email address
 *
 * @apiSuccess {String} message Success message
 */
router.post('/forgot_password', authenticateToken,async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const token = generatePasswordResetToken();
    const expirationTime = new Date(Date.now() + 3600000); // One hour from now
    const passwordResetToken = await PasswordResetToken.create({
      token,
      user_id: user._id, // Use the correct attribute name for MongoDB
      expires_at: expirationTime,
    });
    if (!passwordResetToken) {
      return res.status(500).json({ error: 'Failed to create password reset token' });
    }
    // send password reset email to user's email address
    sendPasswordResetEmail(user.email, token);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
/**
 * @api {post} /reset-password Reset password
 * @apiName ResetPassword
 * @apiGroup Users
 *
 * @apiParam {String} token Password reset token
 * @apiParam {String} password New password
 * @apiParam {String} confirmPassword Confirm new password
 *
 * @apiSuccess {String} message Success message
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    const validationResult = await resetPasswordValidators(token, password, confirmPassword);

    if (validationResult.error) {
      return res.status(validationResult.status).json({ error: validationResult.error });
    }

    return res.json({ message: validationResult.message });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @api {post} /start_lottery Start a lottery
 * @apiName StartLottery
 * @apiGroup Lottery
 *
 * @apiSuccess {String} message Success message
 * @apiSuccess {Array} lotteries List of started lotteries
 */

// Route to start a lottery by the admin
router.post('/start_lottery', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Set a start date for the lottery
    const startDate = new Date();

    // Find users whose last_played field is null
    const users = await User.find({ last_played: null });

    // Start lottery for eligible users
    const lotteries = await Promise.all(
      users.map(async (user) => {
        const newLottery = new Lottery({ purchase_date: startDate });
        await newLottery.save();

        user.lotteries.push(newLottery._id);
        user.last_played = startDate;
        await user.save();

        return newLottery;
      })
    );

    return res.status(200).json({ message: 'Lottery started successfully', lotteries });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong while starting the lottery' });
  }
});
/**
 * @api {post} /close_lottery Close the latest lottery
 * @apiName CloseLottery
 * @apiGroup Lottery
 *
 * @apiSuccess {String} message Success message
 * @apiSuccess {Object} lottery Closed lottery details
 */
// Close lottery function
router.post('/close_lottery', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Set the end date for the lottery
    const endDate = new Date();

    // Find the latest lottery and update the end date
    const latestLottery = await Lottery.findOne().sort({ purchase_date: -1 }).limit(1);
    latestLottery.end_date = endDate;
    await latestLottery.save();

    return res.status(200).json({ message: 'Lottery closed successfully', lottery: latestLottery });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong while closing the lottery' });
  }
});






module.exports = router;
