

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null }
});

module.exports = mongoose.model('Student', studentSchema);