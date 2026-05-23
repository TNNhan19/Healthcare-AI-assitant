const express = require('express');
const { 
  registerControler, 
  loginController, 
  forgotPasswordController, 
  resetPasswordController ,
  googleLoginController,
  facebookLoginController,
  deleteAccountController,
  verifyTokenController, // Add this
} = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// REGISTER || POST
router.post('/register', registerControler);

// LOGIN || POST
router.post('/login', loginController);

// FORGOT PASSWORD || POST
router.post('/forgot-password', forgotPasswordController);

// RESET PASSWORD || POST
router.post('/reset-password', resetPasswordController);
// GOOGLE LOGIN || POST
router.post('/google-login', googleLoginController);

// FACEBOOK LOGIN || POST
router.post('/facebook-login', facebookLoginController);

// VERIFY TOKEN || GET
router.get('/me', authMiddleware, verifyTokenController);

// DELETE ACCOUNT || DELETE (requires auth)
router.delete('/delete-account', authMiddleware, deleteAccountController);

module.exports = router;
