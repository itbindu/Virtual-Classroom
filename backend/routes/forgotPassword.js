const express = require('express');
const crypto = require('crypto');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { sendEmail } = require('../services/emailService');
const router = express.Router();

router.post('/forgot-password', async (req, res) => {
  const { emailOrPhone } = req.body;
  if (!emailOrPhone) return res.status(400).json({ success: false, message: 'Email or phone is required' });

  try {
    const user = await Teacher.findOne({ $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }] }) ||
                 await Student.findOne({ $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }] });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    const result = await sendEmail(
      user.email,
      'Password Reset Request',
      `Click the link to reset your password: ${resetLink}`
    );

    if (!result.success) return res.status(500).json({ success: false, message: 'Failed to send reset email' });

    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password are required' });

  try {
    const user = await Teacher.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } }) ||
                 await Student.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;