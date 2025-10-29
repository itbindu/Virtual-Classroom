import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Welcome to Quiz Platform</h1>
      <div className="options">
        <button onClick={() => navigate('/teacher/register')} className="btn">Teacher Register</button>
        <button onClick={() => navigate('/teacher/login')} className="btn">Teacher Login</button>
        <button onClick={() => navigate('/student/register')} className="btn">Student Register</button>
        <button onClick={() => navigate('/student/login')} className="btn">Student Login</button>
      </div>
    </div>
  );
};

export default Home;