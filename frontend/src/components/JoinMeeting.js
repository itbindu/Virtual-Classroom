// Updated file: src/components/JoinMeeting.js (after join, navigate to StudentMeetingRoom and store name)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./JoinMeeting.css";

const JoinMeeting = () => {
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState('');
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeeting();
  }, [meetingId]);

  const fetchMeeting = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/students/meeting/${meetingId}`);
      setMeeting(response.data.meeting);
      setParticipants(response.data.meeting.participants || []);
    } catch (error) {
      setMessage('Meeting not found or inactive.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/students/join-meeting/${meetingId}`, { name, email });
      setMessage(response.data.message);
      setParticipants(response.data.participants);
      setJoined(true);
      // Store name for meeting room
      localStorage.setItem('currentStudentName', name);
      // Navigate to student meeting room
      navigate(`/student/meeting-room/${meetingId}`);
    } catch (error) {
      setMessage('Failed to join: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading meeting...</div>;
  if (!meeting) return <div>{message || 'Meeting not found.'}</div>;

  return (
    <div className="join-meeting-container">
      <h2>Join Meeting: {meeting.title}</h2>
      <p>Hosted by: {meeting.teacherId?.firstName} {meeting.teacherId?.lastName}</p>
      
      {!joined ? (
        <form onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Joining...' : 'Join Meeting'}
          </button>
        </form>
      ) : (
        <div>
          <h3>Welcome, {name}!</h3>
          <p>Redirecting to meeting room...</p>
        </div>
      )}
      
      {message && <p>{message}</p>}
      <button onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default JoinMeeting;