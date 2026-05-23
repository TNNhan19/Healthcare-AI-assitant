const userModel = require('../models/userModel');
const bcryptjs = require('bcryptjs');
const JWT= require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const ResetToken = require("../models/resetTokenModel");
const axios = require("axios");

const registerControler= async (req,res) => {
    try {
        const {userName,email,password,phone,address,answer, nickname, dob, gender, defaultAddress, paymentMethods}= req.body;
        if (!userName || !email || !password || !phone|| !address || !answer) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        // checkuser
        const exisiting= await userModel.findOne({email:email});
        if (exisiting) {
            return res.status(500).json({
                success: false,
                message: 'User already exists'
            });
        }
        //hash password
        var salt=bcryptjs.genSaltSync(10);
        const hashedPassword= await bcryptjs.hash(password,salt);
        // create user
        const user= await userModel.create({
            userName,
            email,
            password : hashedPassword,
            phone,
            address,
            answer,
            nickname: nickname || '',
            dob: dob || null,
            gender: gender || '',
            defaultAddress: defaultAddress || '',
            paymentMethods: paymentMethods || []
        });
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error in registration',
            error: error.message
        });
    }
};

//LOGIN
const loginController=async (req,res) => {
    try {
        const {email,password}= req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        const user= await userModel.findOne({email});
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // check user password | compare password
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn đã bị khóa do vi phạm chính sách. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.'
            });
        }
        //token
        const token = JWT.sign(
          {
            id: user._id,
            email: user.email,
            userType: user.userType   // thêm userType vào token
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        user.password = undefined; // remove password from response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Error in login',
            error: error.message
    })
}
};
// FORGOT PASSWORD
const forgotPasswordController = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  try {
    const user = await userModel.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "Email not found" });

    // Xóa OTP cũ nếu còn
    await ResetToken.deleteMany({ email });

    // Tạo mã OTP mới
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu vào DB
    const token = new ResetToken({
      email,
      code,
      expire: new Date(Date.now() + 5 * 60 * 1000), // hết hạn sau 5 phút
    });
    await token.save();

    // Gửi email OTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"HealthCare App" <no-reply@healthcare.com>',
      to: email,
      subject: "Password Reset Code",
      text: `Your reset code is: ${code}. It will expire in 5 minutes.`,
    });

    res.json({ success: true, message: "Reset code sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// RESET PASSWORD
const resetPasswordController = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const record = await ResetToken.findOne({ email, code });
    if (!record)
      return res.status(400).json({ success: false, message: "Invalid or expired code" });

    if (record.expire < new Date()) {
      await ResetToken.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: "Code expired" });
    }

    const user = await userModel.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "Email not found" });

    const hashed = await bcryptjs.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    // Xóa OTP sau khi dùng
    await ResetToken.deleteOne({ _id: record._id });

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const googleLoginController = async (req, res) => {
  try {
    const { token } = req.body; // access_token từ frontend
    const response = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
    const { email, name, picture, id } = response.data;

    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({ 
        email, 
        userName: name, 
        profile: picture, 
        googleId: id,
        userType: 'client' // Set default user type
      });
    } else {
      // Update existing user with Google ID if not present
      if (!user.googleId) {
        user.googleId = id;
        await user.save();
      }
    }

    const jwtToken = JWT.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    user.password = undefined; // Remove password from response
    res.json({ success: true, token: jwtToken, user });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ success: false, message: "Google login failed", error: err.message });
  }
};
const facebookLoginController = async (req, res) => {
  try {
    const { token } = req.body; // access_token từ client Facebook
    const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`);
    const { email, name, id, picture } = response.data;

    // Some FB accounts (or dev mode) do not return email even with scope.
    // Fallback: synthesize a unique placeholder email to allow login in dev.
    const resolvedEmail = email || `${id}@facebook.local`;

    // Try to find by email first
    let user = await userModel.findOne({ email: resolvedEmail });

    // If not found and original email missing, try find by facebookId
    if (!user && !email) {
      user = await userModel.findOne({ facebookId: id });
    }

    if (!user) {
      user = await userModel.create({ 
        email: resolvedEmail, 
        userName: name, 
        profile: picture?.data?.url || picture?.url, 
        facebookId: id,
        userType: 'client' // Set default user type
      });
    } else {
      // Update existing user with Facebook ID if not present
      if (!user.facebookId) {
        user.facebookId = id;
        await user.save();
      }
    }

    const jwtToken = JWT.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    user.password = undefined; // Remove password from response
    res.json({ success: true, token: jwtToken, user });
  } catch (err) {
    console.error('Facebook login error:', err);
    if (err.response?.data?.error) {
      res.status(401).json({ 
        success: false, 
        message: "Facebook login failed", 
        error: err.response.data.error.message 
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: "Facebook login failed", 
        error: err.message 
      });
    }
  }
};


// DELETE ACCOUNT
const deleteAccountController = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    // Find user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user and all related data
    await userModel.findByIdAndDelete(userId);
    
    // TODO: Delete related data (orders, appointments, etc.)
    // This would require additional cleanup based on your data model

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};

const verifyTokenController = async (req, res) => {
  try {
    // authMiddleware has already run and attached the user to req.user
    const user = await userModel.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  registerControler,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  googleLoginController,
  facebookLoginController,
  deleteAccountController,
  verifyTokenController, // Export the new controller
};
