const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { generateAndSendOtp } = require('../services/otpService');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Send OTP for student registration
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const otpResult = await generateAndSendOtp(email);
  res.status(otpResult.success ? 200 : 500).json(otpResult);
});

// Verify OTP for student
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
  const { verifyOtp } = require('../services/otpService');
  const otpResult = verifyOtp(email, otp);
  res.status(otpResult.success ? 200 : 400).json(otpResult);
});

// Signup student after OTP verification
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;
  if (!firstName || !lastName || !email || !phoneNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingStudent = await Student.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingStudent) {
      return res.status(400).json({ message: 'Email or phone number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new Student({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      isEmailVerified: true,
      isApproved: false, // Starts as unapproved
    });

    await newStudent.save();
    res.status(200).json({ message: 'Student account created successfully! Awaiting teacher approval.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: `Signup failed. Try again. Error: ${error.message}` });
  }
});

// Login student
router.post('/login', async (req, res) => {
  const { emailOrPhone, password } = req.body;
  if (!emailOrPhone || !password) return res.status(400).json({ message: 'Email/Phone and password are required' });

  try {
    const user = await Student.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isEmailVerified) return res.status(400).json({ message: 'Please verify your email' });
    if (!user.isApproved) return res.status(403).json({ message: 'Account is not approved by teacher yet' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, userId: user._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check student approval status
router.get('/check-approval', authenticateToken, async (req, res) => {
  try {
    const user = await Student.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json({ isApproved: user.isApproved });
  } catch (error) {
    console.error('Check approval error:', error);
    res.status(500).json({ message: 'Failed to check approval' });
  }
});

module.exports = router;