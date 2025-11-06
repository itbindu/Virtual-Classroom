// Updated file: src/components/JoinMeeting.js (fix unused variable and useEffect dependency)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import './JoinMeeting.css';

const JoinMeeting = () => {
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [participants, setParticipants] = useState([]); // Used now
  const [message, setMessage] = useState('');
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myStream, setMyStream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const navigate = useNavigate();

  const socketRef = useRef();
  const peersRef = useRef([]);
  const userVideo = useRef();
  const peersVideo = useRef({});

  // Define fetchMeeting inside component
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

  useEffect(() => {
    fetchMeeting();
    socketRef.current = io.connect('http://localhost:5000');

    return () => {
      socketRef.current?.disconnect();
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [meetingId, fetchMeeting]); // Add fetchMeeting to dependencies

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/students/join-meeting/${meetingId}`, { name, email });
      setMessage(response.data.message);
      setParticipants(response.data.participants);
      setJoined(true);

      // Get user media (video and audio)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyStream(stream);
      if (userVideo.current) userVideo.current.srcObject = stream;

      // Join socket room
      socketRef.current.emit('join-meeting', meetingId);

      // Handle incoming peers
      socketRef.current.on('user-joined', (data) => {
        const peer = createPeer(data.userId, stream, true);
        peersRef.current.push({ peer, userId: data.userId });
      });

      // Signaling events
      socketRef.current.on('offer', (data) => {
        const peer = createPeer(data.sender, stream, false);
        peer.signal(data.offer);
        peersRef.current.push({ peer, userId: data.sender });
      });

      socketRef.current.on('answer', (data) => {
        const peer = peersRef.current.find(p => p.userId === data.sender);
        if (peer) peer.peer.signal(data.answer);
      });

      socketRef.current.on('ice-candidate', (data) => {
        const peer = peersRef.current.find(p => p.userId === data.sender);
        if (peer) peer.peer.signal(data.candidate);
      });

      // Chat
      socketRef.current.on('chat-message', (data) => {
        setChatMessages(prev => [...prev, data]);
      });

    } catch (error) {
      setMessage('Failed to join: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const createPeer = (userId, stream, initiator) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
    });

    peer.on('signal', (data) => {
      if (data.type === 'offer' || data.type === 'answer') {
        socketRef.current.emit(data.type, { meetingId, [data.type]: data, sender: socketRef.current.id });
      } else if (data.candidate) {
        socketRef.current.emit('ice-candidate', { meetingId, candidate: data, sender: socketRef.current.id });
      }
    });

    peer.on('stream', (stream) => {
      if (peersVideo.current[userId]) {
        peersVideo.current[userId].srcObject = stream;
      }
    });

    return peer;
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socketRef.current.emit('chat-message', { meetingId, message: chatInput, sender: name });
      setChatInput('');
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
          <h3>Participants ({participants.length})</h3>
          <ul>
            {participants.map((p, index) => (
              <li key={index}>{p.name} ({p.email})</li>
            ))}
          </ul>
          {/* Placeholder for actual meeting content: video, chat, etc. */}
          <div className="meeting-room-placeholder">
            <p>Meeting room - You are now in the meeting!</p>
            {/* Integrate WebRTC, Socket.io chat, etc., here */}
          </div>
        </div>
      )}
      
      {message && <p>{message}</p>}
      <button onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default JoinMeeting;