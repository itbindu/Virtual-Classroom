const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateAndSendOtp, verifyOtp } = require('../services/otpService');
const authenticateToken = require('../middleware/auth');
const Teacher = require('../Models/Teacher');
const Student = require('../Models/Student');

const router = express.Router();

// Forgot Password - Send OTP
router.post('/forgot-password/send-otp', async (req, res) => {
  const { email, userType } = req.body; // userType: 'teacher' or 'student'
  if (!email || !userType) return res.status(400).json({ message: 'Email and user type are required' });

  let UserModel = userType === 'teacher' ? Teacher : Student;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otpResult = await generateAndSendOtp(email);
    if (otpResult.success) {
      res.status(200).json({ message: 'OTP sent to your email' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP for Forgot Password
router.post('/forgot-password/verify-otp', async (req, res) => {
  const { email, otp, userType } = req.body;
  if (!email || !otp || !userType) return res.status(400).json({ message: 'Email, OTP, and user type are required' });

  let UserModel = userType === 'teacher' ? Teacher : Student;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otpResult = verifyOtp(email, otp);
    if (otpResult.success) {
      res.status(200).json({ message: 'OTP verified', userId: user._id });
    } else {
      res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/forgot-password/reset', async (req, res) => {
  const { email, newPassword, userType } = req.body;
  if (!email || !newPassword || !userType) return res.status(400).json({ message: 'Email, new password, and user type are required' });

  let UserModel = userType === 'teacher' ? Teacher : Student;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;