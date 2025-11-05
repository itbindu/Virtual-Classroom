/*const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

module.exports = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);

*/
// Updated file: backend/models/Teacher.js (optional: add students array for teacher-side tracking)
/*const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }] // Optional: track assigned students
});

module.exports = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
*/

// Updated file: backend/models/Teacher.js (optional: track students array)
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }] // Track assigned students
});

module.exports = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);