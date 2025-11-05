// Updated file: backend/models/Student.js (clean multi-relationship, remove legacy 'teacherId')
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false }, // True if teachers.length > 0
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }] // Multi-relationship
});

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);