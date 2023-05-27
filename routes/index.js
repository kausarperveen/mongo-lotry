const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/checkRegisterd')
const userctrl=require('../controllers/userctrl')
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
router.post('/signup', userctrl.signup) 

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
router.post('/login', userctrl.login)
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

router.post('/forgot_password', authenticateToken,userctrl.sendPasswordResetemail) 
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


router.post('/reset-password',authenticateToken,userctrl.resetPassword)



module.exports = router;
