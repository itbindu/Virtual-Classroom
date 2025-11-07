const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();

// ✅ Allow both local & deployed frontend
app.use(cors({
  origin: [
    "https://fastidious-horse-8a79d9.netlify.app",
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(express.json());

// ✅ MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('❌ MongoDB URI is not defined in .env');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ✅ Route Mounting
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);

// ✅ Root Route
app.get('/', (req, res) => {
  res.send('Backend is running successfully 🚀');
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
