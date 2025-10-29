const express = require('express');
const { generateAndSendOtp, verifyOtp } = require('../services/otpService');
const router = express.Router();

// Route to generate and send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const result = await generateAndSendOtp(email);
  res.status(result.success ? 200 : 500).json(result);
});

// Route to verify OTP
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  const result = verifyOtp(email, otp);
  res.status(result.success ? 200 : 400).json(result);
});

module.exports = router;