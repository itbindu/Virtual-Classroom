// Updated file: src/App.js (fix route path to match navigation: /student/meeting-room/:meetingId)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import HomePage from './components/HomePage';
import TeacherRegister from './components/Teacher/TeacherRegister';
import TeacherLogin from './components/Teacher/TeacherLogin';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import CreateMeeting from './components/CreateMeeting';
import TeacherMeetingRoom from './components/TeacherMeetingRoom';
import StudentRegister from './components/Student/StudentRegister';
import StudentLogin from './components/Student/StudentLogin';
import StudentDashboard from './components/Student/StudentDashboard';
import MeetingLinks from './components/MeetingLinks';
import ForgotPassword from './components/ForgotPassword';
import JoinMeeting from './components/JoinMeeting';
import StudentMeetingRoom from './components/StudentMeetingRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/teacher/register" element={<TeacherRegister />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/create-meeting" element={<CreateMeeting />} />
        <Route path="/teacher/meeting/:meetingId" element={<TeacherMeetingRoom />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/meeting-links" element={<MeetingLinks />} />
        <Route path="/meeting/:meetingId" element={<JoinMeeting />} />
        <Route path="/student/meeting-room/:meetingId" element={<StudentMeetingRoom />} /> {/* Fixed: match navigation from JoinMeeting */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App;