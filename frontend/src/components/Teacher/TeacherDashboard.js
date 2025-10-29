import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [showApprovalPage, setShowApprovalPage] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegisteredStudents();
  }, []);

  const fetchRegisteredStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/teachers/registered-students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRegisteredStudents(response.data.students);
        setMessage('');
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
    navigate("/teacher/login");
  };

  return (
    <div className="dashboard-container">
      <h2>Teacher Dashboard</h2>
      <button onClick={handleLogout} className="logout-btn">Logout</button>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-box">Give Access to Students</div>
        <div className="dashboard-box">Create Meeting Link</div>
        <div className="dashboard-box">Create Quiz</div>
        <div className="dashboard-box">Leaderboard</div>
        <div className="dashboard-box">Attendance</div>
        <div className="dashboard-box">Upload Files (LMS)</div>
      </div>

      {/* Button to Open Approval Page */}
      <button onClick={() => setShowApprovalPage(!showApprovalPage)} className="toggle-approval-btn">
        {showApprovalPage ? "Hide Approval Page" : "Show Approval Page"}
      </button>

      {/* Approval Page */}
      {showApprovalPage && (
        <div className="approval-page">
          <h3>Registered Students</h3>
          {message && <p className="message">{message}</p>}
          {registeredStudents.length > 0 ? (
            <ul>
              {registeredStudents.map((student) => (
                <li key={student._id}>
                  {student.firstName} {student.lastName} ({student.email}) - Approved: {student.isApproved ? "Yes" : "No"}
                  {!student.isApproved && (
                    <button onClick={() => handleApproveStudent(student._id)} className="approve-btn">
                      Approve
                    </button>
                  )}
                </li>
              ))}
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