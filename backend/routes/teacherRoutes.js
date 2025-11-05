// Updated file: backend/routes/teacherRoutes.js (fix nodemailer.createTransport)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Teacher = require('../Models/Teacher');
const Student = require('../Models/Student');
const Meeting = require('../Models/Meeting');
const nodemailer = require('nodemailer');
const { generateAndSendOtp } = require('../services/otpService');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Create email transporter (fixed: createTransport)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

// Fetch ALL students with populated teachers info
router.get('/registered-students', authenticateToken, async (req, res) => {
  try {
    const students = await Student.find()
      .populate('teachers', 'firstName lastName email') // Populate all assigned teachers
      .select('firstName lastName email phoneNumber isApproved teachers');
    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registered students' });
  }
});

// Assign/Approve student - add current teacher to array if not already
router.post('/approve-student', authenticateToken, async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ message: 'Student ID is required' });
  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    // Ensure teachers array exists - initialize if undefined
    if (!student.teachers) {
      student.teachers = [];
    }
    
    // Check if current teacher already assigned
    if (student.teachers.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already assigned to this student.' });
    }
    
    // Add current teacher to array
    student.teachers.push(req.user.id);
    
    // Set isApproved true if first assignment
    if (student.teachers.length === 1) {
      student.isApproved = true;
    }
    
    // Add student to teacher's students array
    await Teacher.findByIdAndUpdate(req.user.id, { $addToSet: { students: studentId } });
    
    await student.save();
    
    // Notify student
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: `Assigned to ${req.user.email}!`,
      html: `
        <h2>Dear ${student.firstName} ${student.lastName},</h2>
        <p>You have been assigned to teacher ${req.user.email}.</p>
        <p>You can now access their meetings and resources.</p>
        <p>Total teachers: ${student.teachers.length}</p>
        <p>Best regards,<br>Your Learning Platform</p>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`Assignment email sent to ${student.email}`);

    res.status(200).json({ message: `Student assigned to you successfully. Total teachers: ${student.teachers.length}` });
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ message: 'Failed to assign student' });
  }
});

// Create meeting - notify all assigned students
router.post('/create-meeting', authenticateToken, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Meeting title is required' });

  try {
    const meetingId = 'meeting_' + Math.random().toString(36).substr(2, 9);

    const newMeeting = new Meeting({
      title,
      teacherId: req.user.id,
      meetingId
    });

    await newMeeting.save();

    // Fetch students assigned to this teacher (this teacher in their teachers array)
    const assignedStudents = await Student.find({ teachers: req.user.id });
    const meetingLink = `http://localhost:3000/meeting/${meetingId}`;

    let notifiedCount = 0;
    if (assignedStudents.length > 0) {
      for (const student of assignedStudents) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: `New Meeting from ${req.user.email}: ${title}`,
          html: `
            <h2>Dear ${student.firstName} ${student.lastName},</h2>
            <p>Your teacher ${req.user.email} has created a new meeting titled <strong>${title}</strong>.</p>
            <p>Join here: <a href="${meetingLink}">${meetingLink}</a></p>
            <p>Best regards,<br>Your Learning Platform</p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${student.email}`);
        notifiedCount++;
      }
    } else {
      console.log('No assigned students to notify.');
    }

    res.status(200).json({ 
      success: true, 
      message: `Meeting created! ${notifiedCount} assigned students notified.`,
      meetingId,
      link: meetingLink 
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Failed to create meeting' });
  }
});

// Get teacher's meetings
router.get('/meetings', authenticateToken, async (req, res) => {
  try {
    const meetings = await Meeting.find({ teacherId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, meetings });
  } catch (error) {
    console.error('Fetch meetings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
  }
});

// Get teacher profile with students
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id).populate('students', 'firstName lastName email');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.status(200).json({ success: true, teacher });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

module.exports = router;