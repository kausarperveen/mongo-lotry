const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/checkRegisterd')
const userctrl=require('../controllers/userctrl')
router.get('/', function(req, res, next) {
    res.send('well come to shib lottery');
  });
router.post('/signup', userctrl.signup) 
router.post('/login', userctrl.login)
router.post('/forgot_password', authenticateToken,userctrl.sendPasswordResetemail)
router.post('/reset-password',authenticateToken,userctrl.resetPassword)



module.exports = router;
