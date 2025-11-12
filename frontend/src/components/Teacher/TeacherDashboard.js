// Updated file: src/components/Teacher/TeacherDashboard.js (ensure name display and registered students)
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [showApprovalPage, setShowApprovalPage] = useState(false);
  const [message, setMessage] = useState('');
  const [teacherName, setTeacherName] = useState('Teacher'); // Default fallback
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeacherProfile();
    fetchRegisteredStudents();
  }, []);

  const fetchTeacherProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found for profile fetch");
        return;
      }
      console.log("Fetching teacher profile with token:", token.substring(0, 20) + '...');
      const response = await axios.get("http://localhost:5000/api/teachers/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Profile response:", response.data);
      const firstName = response.data.firstName || '';
      const lastName = response.data.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      setTeacherName(fullName || 'Teacher');
    } catch (error) {
      console.error("Fetch teacher profile error:", error.response?.data || error.message);
      // Fallback to localStorage
      const storedUser = JSON.parse(localStorage.getItem('teacherUser') || '{}');
      if (storedUser.firstName && storedUser.lastName) {
        const fullName = `${storedUser.firstName} ${storedUser.lastName}`.trim();
        setTeacherName(fullName);
      } else {
        setTeacherName('Teacher');
      }
    }
  };

  const fetchRegisteredStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/teachers/registered-students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRegisteredStudents(response.data.students);
        setMessage('');
      } else {
        setMessage('No registered students found.');
      }
    } catch (error) {
      console.error("Error fetching students:", error.response?.data || error.message);
      setMessage('Failed to fetch registered students: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApproveStudent = async (studentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/teachers/approve-student",
        { studentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      fetchRegisteredStudents(); // Refresh the list
    } catch (error) {
      console.error("Approve student error:", error.response?.data || error.message);
      setMessage('Failed to approve student: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem('teacherUser');
    navigate("/teacher/login");
  };

  return (
    <div className="dashboard-container">
      <h2>Teacher Dashboard - Welcome, {teacherName}!</h2>
      <button onClick={handleLogout} className="logout-btn">Logout</button>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <Link to="#" onClick={() => setShowApprovalPage(true)} className="dashboard-box">Give Access to Students</Link>
        <Link to="/teacher/create-meeting" className="dashboard-box">Create Meeting Link</Link>
        <Link to="/teacher/create-quiz" className="dashboard-box">Create Quiz</Link>
        <div className="dashboard-box">Leaderboard</div>
        <div className="dashboard-box">Attendance</div>
        <div className="dashboard-box">Upload Files (LMS)</div>
      </div>

      {/* Button to Open Approval Page */}
      <button onClick={() => setShowApprovalPage(!showApprovalPage)} className="toggle-approval-btn">
        {showApprovalPage ? "Hide Approval Page" : "All Students (Assign Multiple Teachers Possible)"}
      </button>

      {/* Approval Page */}
      {showApprovalPage && (
        <div className="approval-page">
          <h3>All Registered Students</h3>
          <p>Students can be assigned to multiple teachers. Assign yourself to any student not already assigned to you.</p>
          {message && <p className="message">{message}</p>}
          {registeredStudents.length > 0 ? (
            <ul>
              {registeredStudents.map((student) => {
                const isAssignedToMe = student.teachers.some(t => t._id === localStorage.getItem('teacherId')); // Assume teacherId stored on login
                const assignedTeachers = student.teachers.map(t => `${t.firstName} ${t.lastName}`).join(', ') || 'None';
                return (
                  <li key={student._id}>
                    {student.firstName} {student.lastName} ({student.email})
                    <span className="status"> - Assigned Teachers: {assignedTeachers}</span>
                    {!isAssignedToMe && (
                      <button onClick={() => handleApproveStudent(student._id)} className="approve-btn">
                        Assign to Me
                      </button>
                    )}
                    {isAssignedToMe && <span className="already-assigned"> (Already Assigned to You)</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No registered students found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;