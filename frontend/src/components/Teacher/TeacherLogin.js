import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./TeacherLogin.css";

const TeacherLogin = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailOrPhone) return alert("Enter your email or phone.");
    if (!password) return alert("Enter your password.");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/teachers/login",
        { emailOrPhone, password }
      );
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        alert("Login successful!");
        navigate("/teacher/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      alert("Invalid credentials. Try again.");
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

            <button type="submit" className="btn">
              Login
            </button>

            <p className="forgot">
              <a href="/forgot-password">Forgot Password?</a>
            </p>
          </form>

          <p>
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/teacher/register")}
              className="toggle-link"
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;