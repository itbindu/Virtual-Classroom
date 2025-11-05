// New file: src/components/TeacherMeetingRoom.js (separate room for teacher, auto-join)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import './TeacherMeetingRoom.css'; // Separate CSS if needed, or reuse JoinMeeting.css

const TeacherMeetingRoom = () => {
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [teacher, setTeacher] = useState({ firstName: '', lastName: '', email: '' });
  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [myStream, setMyStream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const navigate = useNavigate();

  const socketRef = useRef();
  const peersRef = useRef([]);
  const videoRef = useRef();
  const userVideo = useRef();
  const peersVideo = useRef({});

  useEffect(() => {
    fetchTeacherProfile();
    fetchMeeting();
    getMediaStream();
    socketRef.current = io.connect('http://localhost:5000');
    joinMeeting();

    return () => {
      socketRef.current?.disconnect();
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [meetingId]);

  const fetchTeacherProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/teachers/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeacher(response.data.teacher);
    } catch (error) {
      setMessage('Failed to fetch profile: ' + (error.response?.data?.message || error.message));
    }
  };

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

  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyStream(stream);
      if (userVideo.current) userVideo.current.srcObject = stream;
    } catch (error) {
      setMessage('Failed to access camera/microphone: ' + error.message);
    }
  };

  const joinMeeting = () => {
    socketRef.current.emit('join-meeting', meetingId);

    // Handle incoming peers (students joining)
    socketRef.current.on('user-joined', (data) => {
      const peer = createPeer(data.userId, myStream, true); // Teacher initiates
      peersRef.current.push({ peer, userId: data.userId });
    });

    // Signaling for WebRTC
    socketRef.current.on('offer', (data) => {
      const peer = createPeer(data.sender, myStream, false);
      peer.signal(data.offer);
      peersRef.current.push({ peer, userId: data.sender });
    });

    socketRef.current.on('answer', (data) => {
      const peer = peersRef.current.find(p => p.userId === data.sender);
      if (peer && peer.peer) peer.peer.signal(data.answer);
    });

    socketRef.current.on('ice-candidate', (data) => {
      const peer = peersRef.current.find(p => p.userId === data.sender);
      if (peer && peer.peer) peer.peer.signal(data.candidate);
    });

    // Chat
    socketRef.current.on('chat-message', (data) => {
      setChatMessages(prev => [...prev, data]);
    });
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
      const sender = `${teacher.firstName} ${teacher.lastName}`;
      socketRef.current.emit('chat-message', { meetingId, message: chatInput, sender });
      setChatInput('');
    }
  };

  if (loading) return <div>Loading meeting room...</div>;
  if (!meeting) return <div>{message || 'Meeting not found.'}</div>;

  return (
    <div className="teacher-meeting-container">
      <h2>Meeting Room: {meeting.title}</h2>
      <p>You are hosting as: {teacher.firstName} {teacher.lastName}</p>
      <p>Current Participants: {participants.length}</p>
      
      <div className="meeting-room">
        {/* Video Section */}
        <div className="video-section">
          <h3>Your Video (Teacher)</h3>
          <video ref={userVideo} autoPlay muted playsInline className="user-video" />
          
          <h3>Students Videos</h3>
          <div className="peers-videos">
            {Object.keys(peersVideo.current).map((id) => (
              <video key={id} ref={el => { if (el) peersVideo.current[id] = el; }} autoPlay playsInline className="peer-video" />
            ))}
          </div>
        </div>
        
        {/* Chat Section */}
        <div className="chat-section">
          <h3>Chat</h3>
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className="message">
                <strong>{msg.sender}:</strong> {msg.message} <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
          <form onSubmit={sendChatMessage} className="chat-input-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message as teacher..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
      
      {message && <p className="error">{message}</p>}
      <button onClick={() => navigate('/teacher/dashboard')} className="leave-btn">
        End Meeting & Back to Dashboard
      </button>
    </div>
  );
};

export default TeacherMeetingRoom;
