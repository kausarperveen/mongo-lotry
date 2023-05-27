const bcrypt = require('bcrypt');
const User = require('../models/user'); // import the User model
const Lottery = require('../models/lottery'); // import the Lottery model
const PasswordResetToken = require('../models/PasswordResetToken')
var { signupValidators,loginValidators,resetPasswordValidators } = require('../inputvalidators/input')
var {generatePasswordResetToken,sendPasswordResetEmail}=require('../helper/adminhelper')
//sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { isAdmin } = require('../middlewares/isAdmin');
const { authenticateToken } = require('../middlewares/checkRegisterd')
async function signup(req, res) {
    try {
      await signupValidators(req.body);
      const user = await User.create(req.body);
      res.json({ statusCode: 200, message: "User registered successfully", data: user });
    } catch (error) {
      console.error(error);
      res.status(error.code).json({ error: error.error });
    }
  }
  
async function login(req, res) {
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
  }
  
async function sendPasswordResetemail(req, res) {
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
        user_id: user._id,
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
  }
  
async function resetPassword(req, res) {
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
  }
  module.exports={
    signup,
    login,
    sendPasswordResetemail,
    resetPassword
  }