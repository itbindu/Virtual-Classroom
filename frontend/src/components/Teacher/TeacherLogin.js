// Updated file: src/components/Teacher/TeacherLogin.js (full fixes: add state, Link import, error handling)
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Added Link import
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./TeacherLogin.css";

const TeacherLogin = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Added
  const [message, setMessage] = useState(''); // Added
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailOrPhone) return alert("Enter your email or phone.");
    if (!password) return alert("Enter your password.");
    setLoading(true);
    setMessage(''); // Clear previous message

    try {
      const response = await axios.post(
        "http://localhost:5000/api/teachers/login",
        { emailOrPhone, password }
      );
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (response.data.user) {
          localStorage.setItem('teacherUser', JSON.stringify(response.data.user));
        }
        alert("Login successful!");
        navigate("/teacher/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || 'Invalid credentials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card-container">
        <div className="login-image-side"></div>

        <div className="form-card">
          <form onSubmit={handleLogin}>
            <h2>Teacher Login</h2>

            <input
              type="text"
              placeholder="Email or Phone"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="forgot">
              <Link to="/forgot-password">Forgot Password?</Link>
            </p>
          </form>

          {message && <p className="error-message">{message}</p>}

          <p>
            Don't have an account?{" "}
            <Link to="/teacher/register" className="toggle-link">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;