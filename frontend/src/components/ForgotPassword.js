import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css"; // Adjust path as needed

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset Password
  const [userType, setUserType] = useState("student"); // Default to student
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (pwd) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(pwd);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !isValidEmail(email))
      return alert("Please enter a valid email");
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password/send-otp",
        { email, userType }
      );
      setMessage(response.data.message);
      setStep(2);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return alert("Please enter the OTP");
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password/verify-otp",
        { email, otp, userType }
      );
      setMessage(response.data.message);
      setStep(3);
    } catch (error) {
      setMessage(error.response?.data?.message || "Invalid OTP");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !isValidPassword(newPassword))
      return alert(
        "Password must be 8+ chars, 1 uppercase, 1 number & 1 special char"
      );
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password/reset",
        { email, newPassword, userType }
      );
      setMessage(response.data.message);
      alert("Password reset successfully. Please log in.");
      navigate(`/${userType}/login`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="auth-container">
      <div className="form-card">
        <h2>Forgot Password</h2>

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn">
              Send OTP
            </button>
            {message && <p>{message}</p>}
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button type="submit" className="btn">
              Verify OTP
            </button>
            {message && <p>{message}</p>}
            <button onClick={() => setStep(1)} className="btn secondary">
              Back
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn">
              Reset Password
            </button>
            {message && <p>{message}</p>}
            <button onClick={() => setStep(2)} className="btn secondary">
              Back
            </button>
          </form>
        )}

        <p>
          Remember your password?{" "}
          <span
            onClick={() => navigate(`/${userType}/login`)}
            className="toggle-link"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
