// Updated file: src/components/MeetingLinks.js (add optional chaining for teacherId)
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './MeetingLinks.css';

const MeetingLinks = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/student/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/students/meetings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetings(response.data.meetings || []);
      if (response.data.message) {
        setInfoMessage(response.data.message);
      }
      setError('');
    } catch (err) {
      console.error('Fetch meetings error:', err);
      if (err.response?.status === 404 || err.response?.status === 500) {
        setMeetings([]);
        setInfoMessage(err.response?.data?.message || 'No meetings available yet.');
      } else {
        setError('Failed to load meetings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="meeting-links-container">Loading meetings...</div>;
  }

  return (
    <div className="meeting-links-container">
      <h2>Your Meeting Links (From All Assigned Teachers)</h2>
      {error && <p className="error">{error}</p>}
      {infoMessage && <p className="info">{infoMessage}</p>}
      {meetings.length > 0 ? (
        <ul className="meetings-list">
          {meetings.map((meeting) => (
            <li key={meeting._id} className="meeting-item">
              <div className="meeting-info">
                <h3>{meeting.title}</h3>
                <p>From Teacher: {meeting.teacherId?.firstName || 'Unknown'} {meeting.teacherId?.lastName || ''}</p>
                <p>Created: {new Date(meeting.createdAt).toLocaleDateString()}</p>
              </div>
              <Link to={`/meeting/${meeting.meetingId}`} className="join-btn">
                Join Meeting
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="no-meetings">No meetings from your teachers yet. Check back later.</p>
      )}
      <button onClick={() => navigate('/student/dashboard')} className="back-btn">
        Back to Dashboard
      </button>
    </div>
  );
};

export default MeetingLinks;