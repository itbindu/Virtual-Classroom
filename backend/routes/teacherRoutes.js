const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { generateAndSendOtp } = require('../services/otpService');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Send OTP for teacher registration
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const otpResult = await generateAndSendOtp(email);
  res.status(otpResult.success ? 200 : 500).json(otpResult);
});

// Verify OTP for teacher
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
  const { verifyOtp } = require('../services/otpService');
  const otpResult = verifyOtp(email, otp);
  res.status(otpResult.success ? 200 : 400).json(otpResult);
});

// Signup teacher after OTP verification
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;
  if (!firstName || !lastName || !email || !phoneNumber || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingTeacher = await Teacher.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Email or phone number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newTeacher = new Teacher({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      isEmailVerified: true,
    });

    await newTeacher.save();
    res.status(200).json({ message: 'Teacher account created successfully!' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: `Signup failed. Try again. Error: ${error.message}` });
  }
});

// Login teacher
router.post('/login', async (req, res) => {
  const { emailOrPhone, password } = req.body;
  if (!emailOrPhone || !password) return res.status(400).json({ message: 'Email/Phone and password are required' });

  try {
    const user = await Teacher.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isEmailVerified) return res.status(400).json({ message: 'Please verify your email' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, userId: user._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch all registered students for teacher dashboard
router.get('/registered-students', authenticateToken, async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registered students' });
  }
});

router.get('/registered-students', authenticateToken, async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registered students' });
  }
});

router.post('/approve-student', authenticateToken, async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ message: 'Student ID is required' });
  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.isApproved = true;
    student.teacherId = req.user.id;
    await student.save();
    res.status(200).json({ message: 'Student approved successfully' });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ message: 'Failed to approve student' });
  }
});

module.exports = router;