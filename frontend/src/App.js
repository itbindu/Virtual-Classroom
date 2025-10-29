import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// ✅ Correct imports based on your folder names
import HomePage from './components/HomePage';
import TeacherRegister from './components/Teacher/TeacherRegister';
import TeacherLogin from './components/Teacher/TeacherLogin';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import StudentRegister from './components/Student/StudentRegister';
import StudentLogin from './components/Student/StudentLogin';
import StudentDashboard from './components/Student/StudentDashboard';
import ForgotPassword from './components/ForgotPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/teacher/register" element={<TeacherRegister />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
