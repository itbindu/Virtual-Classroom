// Updated file: backend/models/Meeting.js (ensure conditional for safety)
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  meetingId: { type: String, required: true, unique: true }, // Unique identifier for the link
  participants: [{ 
    name: String, 
    email: String, 
    joinedAt: { type: Date, default: Date.now } 
  }],
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);