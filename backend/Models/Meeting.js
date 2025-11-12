// Updated file: backend/models/Meeting.js (add logs for join/leave tracking)
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  meetingId: { type: String, required: true, unique: true },
  participants: [{ 
    name: String, 
    email: String, 
    joinedAt: { type: Date, default: Date.now } 
  }],
  logs: [{ // New: Track join/leave with timestamps
    userId: String, // Socket ID or user ID
    name: String,
    email: String,
    isTeacher: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date
  }],
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);