// Updated file: src/components/Student/StudentDashboard.js (remove unused 'meetings')
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";
import studentImage from "../../assets/student.png";

function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkApprovalAndFetch = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, redirecting to login");
          navigate("/student/login");
          return;
        }

        console.log("Sending approval check with token:", token);
        const response = await axios.get("http://localhost:5000/api/students/check-approval", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Approval Response:", response.data);
        setApproved(response.data.isApproved);

        // Fetch meetings only if approved
        if (response.data.isApproved) {
          try {
            const meetingsResponse = await axios.get("http://localhost:5000/api/students/meetings", {
              headers: { Authorization: `Bearer ${token}` },
            });
            // Use meetings if needed, but not assigned to state to avoid unused warning
          } catch (error) {
            console.error("Fetch meetings error:", error);
          }
        }
      } catch (error) {
        console.error("Check approval error:", error.response?.data || error.message);
        if (error.response?.status === 403) {
          alert("Your account is not approved yet. Please wait for teacher approval.");
        } else {
          alert("Failed to check approval. Please log in again. Error: " + (error.response?.data?.message || error.message));
        }
        navigate("/student/login");
      } finally {
        setLoading(false);
      }
    };

    checkApprovalAndFetch();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/student/login");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!approved) {
    return <div>Your account is awaiting teacher approval. You cannot access the dashboard yet.</div>;
  }

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Student Dashboard</h2>
      <div className="dashboard-content">
        {/* Left side - Buttons */}
        <div className="dashboard-left">
          <Link to="/meeting-links" className="dashboard-box">Meeting Links</Link>
          <div className="dashboard-box">Notifications</div>
          <div className="dashboard-box">Assignments / Quiz</div>
          <div className="dashboard-box">Leaderboard</div>
          <div className="dashboard-box">Attendance</div>
        </div>
        {/* Right side - Student Image */}
        <div className="dashboard-right">
          <img
            src={studentImage}
            alt="Student illustration"
            className="student-image"
          />
        </div>
      </div>
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </div>
  );
}

export default StudentDashboard;