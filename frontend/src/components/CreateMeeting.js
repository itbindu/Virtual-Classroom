// Updated file: src/components/CreateMeeting.js (after creation, navigate to teacher meeting room)
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateMeeting.css';

const CreateMeeting = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingId, setMeetingId] = useState(''); // Store meetingId for navigation
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMeetingLink('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/teachers/create-meeting',
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setMeetingLink(response.data.link);
      setMeetingId(response.data.meetingId); // Store for navigation
      setTitle('');
    } catch (error) {
      setMessage('Failed to create meeting: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const startMeeting = () => {
    if (meetingId) {
      navigate(`/teacher/meeting/${meetingId}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingLink);
    setMessage('Link copied to clipboard!');
  };

  return (
    <div className="create-meeting-container">
      <h2>Create Meeting</h2>
      <form onSubmit={handleCreateMeeting}>
        <input
          type="text"
          placeholder="Meeting Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Meeting'}
        </button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {meetingLink && (
        <div className="meeting-link-section">
          <h3>Your Meeting Link:</h3>
          <input
            type="text"
            value={meetingLink}
            readOnly
            className="link-input"
          />
          <button onClick={copyToClipboard} className="copy-btn">
            Copy Link
          </button>
          <p>Share this link with your students. Approved students will receive an email notification.</p>
          <button onClick={startMeeting} className="start-btn">
            Start Meeting (Join as Teacher)
          </button>
        </div>
      )}
      <button onClick={() => navigate('/teacher/dashboard')} className="back-btn">
        Back to Dashboard
      </button>
    </div>
  );
};

export default CreateMeeting;