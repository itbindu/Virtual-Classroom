const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../Models/Student');
const { generateAndSendOtp } = require('../services/otpService');
const authenticateToken = require('../middleware/auth');
const Meeting = require('../Models/Meeting');
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
      isApproved: false,
      teachers: [] // Starts as unapproved
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

/// Check approval (true if teachers array has entries)
router.get('/check-approval', authenticateToken, async (req, res) => {
  try {
    const user = await Student.findById(req.user.id).populate('teachers');
    if (!user) return res.status(404).json({ message: 'Student not found' });
    const isApproved = user.teachers.length > 0;
    res.status(200).json({ isApproved });
  } catch (error) {
    console.error('Check approval error:', error);
    res.status(500).json({ message: 'Failed to check approval' });
  }
});

// Get meetings from all assigned teachers
router.get('/meetings', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).populate('teachers');
    if (!student) {
      return res.status(404).json({ meetings: [], message: 'Student not found' });
    }

    if (student.teachers.length === 0) {
      return res.status(200).json({ meetings: [], message: 'No teachers assigned yet.' });
    }

    const meetings = await Meeting.find({ 
      teacherId: { $in: student.teachers.map(t => t._id) }, 
      isActive: true 
    })
      .populate('teacherId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .select('title meetingId createdAt teacherId');

    res.status(200).json({ meetings });
  } catch (error) {
    console.error('Fetch student meetings error:', error);
    res.status(500).json({ meetings: [], message: 'Failed to fetch meetings' });
  }
});

// Join meeting (check if teacher in student's teachers array)
router.post('/join-meeting/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  const { name, email } = req.body;

  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

  try {
    let student = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      student = await Student.findById(decoded.id).populate('teachers');
      if (!student || student.email !== email) {
        return res.status(403).json({ message: 'Invalid student credentials.' });
      }
    } else {
      student = await Student.findOne({ email }).populate('teachers');
      if (!student) {
        return res.status(403).json({ message: 'Student not found.' });
      }
    }

    const meeting = await Meeting.findOne({ meetingId }).populate('teacherId');
    if (!meeting || !meeting.isActive) return res.status(404).json({ message: 'Meeting not found or inactive' });

    // Check if meeting's teacher is in student's teachers array
    const isAssigned = student.teachers.some(t => t._id.toString() === meeting.teacherId._id.toString());
    if (!isAssigned) {
      return res.status(403).json({ message: 'This meeting is not from your assigned teacher.' });
    }

    // Add participant if not already
    const existingParticipant = meeting.participants.find(p => p.email === email);
    if (!existingParticipant) {
      meeting.participants.push({ name, email });
      await meeting.save();
    }

    res.status(200).json({ 
      success: true, 
      message: 'Joined meeting successfully!', 
      participants: meeting.participants,
      meetingTitle: meeting.title 
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({ message: 'Failed to join meeting' });
  }
});

// Get meeting details
router.get('/meeting/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  try {
    const meeting = await Meeting.findOne({ meetingId }).populate('teacherId', 'firstName lastName');
    if (!meeting || !meeting.isActive) return res.status(404).json({ message: 'Meeting not found or inactive' });
    res.status(200).json({ success: true, meeting });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ message: 'Failed to get meeting details' });
  }
});
module.exports = router;