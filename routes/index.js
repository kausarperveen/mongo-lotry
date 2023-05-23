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
/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Create a new user
 *     description: Register a new user with the provided information
 *     tags: [User]
 *     parameters:
 *       - in: formData
 *         name: name
 *         description: User's name
 *         required: true
 *         type: string
 *       - in: formData
 *         name: email
 *         description: User's email address
 *         required: true
 *         type: string
 *       - in: formData
 *         name: password
 *         description: User's password
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       default:
 *         description: Error registering user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
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
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Log in with the provided email and password
 *     tags: [User]
 *     parameters:
 *       - in: formData
 *         name: email
 *         description: User's email address
 *         required: true
 *         type: string
 *       - in: formData
 *         name: password
 *         description: User's password
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 email:
 *                   type: string
 *       default:
 *         description: Error logging in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
 * @swagger
 * /forgot_password:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset email to the user's email address
 *     tags: [User]
 *     parameters:
 *       - in: formData
 *         name: email
 *         description: User's email address
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       default:
 *         description: Error requesting password reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset user's password using the provided token and new password
 *     tags: [User]
 *     parameters:
 *       - in: formData
 *         name: token
 *         description: Password reset token
 *         required: true
 *         type: string
 *       - in: formData
 *         name: password
 *         description: New password
 *         required: true
 *         type: string
 *       - in: formData
 *         name: confirmPassword
 *         description: Confirm new password
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       default:
 *         description: Error resetting password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
 * @swagger
 * /start_lottery:
 *   post:
 *     summary: Start the lottery
 *     description: Start the lottery for eligible users
 *     tags: [Lottery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: The start date for the lottery
 *     responses:
 *       200:
 *         description: Lottery started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 lotteries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The ID of the lottery
 *                       purchase_date:
 *                         type: string
 *                         format: date-time
 *                         description: The date and time when the lottery was purchased
 *       default:
 *         description: Error starting the lottery
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
