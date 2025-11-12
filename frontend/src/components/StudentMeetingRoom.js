// Updated file: src/components/StudentMeetingRoom.js (add notifications, auto-leave on meeting-ended, fix duplicate import)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import './StudentMeetingRoom.css';

const StudentMeetingRoom = () => {
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [notifications, setNotifications] = useState([]); // New: Join/leave messages
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [myStream, setMyStream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [screenSharing, setScreenSharing] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showBlackboard, setShowBlackboard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [studentName, setStudentName] = useState('');
  const navigate = useNavigate();

  const socketRef = useRef();
  const peersRef = useRef([]);
  const userVideo = useRef();
  const peersVideo = useRef({});
  const screenStreamRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setMessage('');
      try {
        const name = localStorage.getItem('currentStudentName') || 'Student';
        setStudentName(name);
        await fetchMeeting();
        await getMediaStream();
        initSocket();
      } catch (error) {
        console.error('Meeting room initialization error:', error);
        setMessage('Failed to initialize meeting room: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => {
      socketRef.current?.disconnect();
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peersRef.current.forEach(({ peer }) => peer.destroy());
    };
  }, [meetingId]);

  const fetchMeeting = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/students/meeting-history/${meetingId}`); // Use history endpoint
      setMeeting(response.data.meeting);
      const updatedParticipants = (response.data.meeting.participants || []).map(p => ({ ...p, isTeacher: false }));
      setParticipants(updatedParticipants);
      setNotifications(response.data.logs.map(log => ({
        message: `${log.name} ${log.leftAt ? 'left' : 'joined'} at ${log.joinedAt.toLocaleTimeString()}`,
        timestamp: log.joinedAt
      })));
    } catch (error) {
      console.error('Fetch meeting error:', error);
      if (error.response?.status === 404) {
        throw new Error('Meeting not found or inactive.');
      } else {
        throw error;
      }
    }
  };

  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyStream(stream);
      if (userVideo.current) userVideo.current.srcObject = stream;
    } catch (error) {
      console.error('Media stream error:', error);
      setMessage('Failed to access camera/microphone (continuing without): ' + error.message);
    }
  };

  const toggleVideo = () => {
    if (myStream && myStream.getVideoTracks().length > 0) {
      const videoTrack = myStream.getVideoTracks()[0];
      videoTrack.enabled = !videoEnabled;
      setVideoEnabled(!videoEnabled);
    } else {
      console.warn('No video track available to toggle');
    }
  };

  const toggleAudio = () => {
    if (myStream && myStream.getAudioTracks().length > 0) {
      const audioTrack = myStream.getAudioTracks()[0];
      audioTrack.enabled = !audioEnabled;
      setAudioEnabled(!audioEnabled);
    } else {
      console.warn('No audio track available to toggle');
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      screenVideoTrack.onended = () => stopScreenShare();

      const audioTracks = myStream ? myStream.getAudioTracks() : [];
      const newStream = new MediaStream([
        screenVideoTrack,
        ...audioTracks
      ]);
      setMyStream(newStream);
      setScreenSharing(true);
      if (userVideo.current) userVideo.current.srcObject = newStream;

      peersRef.current.forEach(({ peer }) => {
        const videoSender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenVideoTrack);
        }
      });

      screenStreamRef.current = screenStream;
    } catch (error) {
      console.error('Screen share error:', error);
      setMessage('Failed to start screen share: ' + error.message);
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const cameraVideoTrack = cameraStream.getVideoTracks()[0];

      const audioTracks = myStream ? myStream.getAudioTracks() : [];
      const newStream = new MediaStream([
        cameraVideoTrack,
        ...audioTracks
      ]);
      setMyStream(newStream);
      setScreenSharing(false);
      if (userVideo.current) userVideo.current.srcObject = newStream;

      peersRef.current.forEach(({ peer }) => {
        const videoSender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(cameraVideoTrack);
        }
      });

      cameraStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Resume camera error:', error);
      setMessage('Failed to resume camera: ' + error.message);
    }
  };

  const toggleBlackboard = () => {
    setShowBlackboard(!showBlackboard);
  };

  const initSocket = () => {
    if (!socketRef.current) {
      socketRef.current = io.connect('http://localhost:5000');
    }
    socketRef.current.emit('join-meeting', { meetingId, userInfo: { name: studentName, isTeacher: false, email: '' } });

    // New: Join/leave notifications
    socketRef.current.on('user-joined-notification', (data) => {
      setNotifications(prev => [...prev, data]);
    });

    socketRef.current.on('user-left-notification', (data) => {
      setNotifications(prev => [...prev, data]);
    });

    socketRef.current.on('meeting-ended', (data) => {
      setMessage(data.message);
      setTimeout(() => navigate('/meeting-links'), 3000); // Auto leave after 3s
    });

    socketRef.current.on('participants-update', (updatedParticipants) => {
      const safeParticipants = updatedParticipants.map(p => ({ ...p, isTeacher: p.isTeacher || false }));
      setParticipants(safeParticipants.filter(p => !p.leftAt)); // Active only
    });

    socketRef.current.on('user-joined', (data) => {
      const peer = createPeer(data.userId, myStream, false);
      peersRef.current.push({ peer, userId: data.userId });
    });

    socketRef.current.on('offer', (data) => {
      const peer = createPeer(data.sender, myStream, false);
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
      if (!socketRef.current) return;
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
      socketRef.current.emit('chat-message', { meetingId, message: chatInput, sender: studentName, timestamp: new Date() });
      setChatInput('');
    }
  };

  const leaveMeeting = () => {
    socketRef.current.disconnect(); // Triggers disconnect event
    navigate('/meeting-links');
  };

  // Find teacher video if available (assume userId in participants from socket)
  const teacherVideoId = participants.find(p => p.isTeacher)?.userId;

  if (loading) {
    return (
      <div className="meeting-room-container">
        <div className="header">
          <h2>Loading meeting...</h2>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="meeting-room-container">
        <div className="header">
          <h2>Meeting Error</h2>
        </div>
        <p>{message || 'Meeting not found.'}</p>
        <button onClick={leaveMeeting} className="leave-btn">Back to Meetings</button>
      </div>
    );
  }

  return (
    <div className="meeting-room-container">
      <div className="header">
        <h2>{meeting.title}</h2>
        <button onClick={leaveMeeting} className="leave-btn">Leave Meeting</button>
      </div>

      {message && <p className="error-message">{message}</p>}

      <div className="main-layout">
        <div className="video-section">
          <div className="teacher-video">
            <h3>{teacherVideoId ? 'Teacher' : 'You'}</h3>
            {teacherVideoId ? (
              <video ref={(el) => { if (el) peersVideo.current[teacherVideoId] = el; }} autoPlay playsInline className="large-video" />
            ) : (
              <video ref={userVideo} autoPlay muted playsInline className="large-video" />
            )}
          </div>

          <div className="students-videos">
            <h3>Other Participants</h3>
            <div className="remote-videos-grid">
              {Object.keys(peersVideo.current).filter(id => id !== teacherVideoId).map((id) => (
                <video key={id} ref={(el) => { if (el) peersVideo.current[id] = el; }} autoPlay playsInline className="small-video" />
              ))}
              {!teacherVideoId && (
                <video ref={userVideo} autoPlay muted playsInline className="small-video" />
              )}
            </div>
          </div>
        </div>

        <div className="participants-sidebar">
          <h3>List of Participants</h3>
          <ul>
            {participants.map((p, index) => (
              <li key={index || p.email || 'anon'}>
                {p.name} ({p.email || 'N/A'})
                {p.isTeacher && ' (Host)'}
              </li>
            ))}
          </ul>
          {/* New: Notifications in sidebar */}
          <div className="notifications">
            <h4>Activity Log</h4>
            {notifications.slice(-5).map((notif, index) => ( // Last 5
              <p key={index} className="notification">{notif.message}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="controls-footer">
        <button onClick={toggleVideo} className="control-btn">
          {videoEnabled ? 'Video Mute' : 'Video Unmute'}
        </button>
        <button onClick={toggleAudio} className="control-btn">
          {audioEnabled ? 'Mic Mute' : 'Mic Unmute'}
        </button>
        <button onClick={screenSharing ? stopScreenShare : startScreenShare} className="control-btn">
          {screenSharing ? 'Stop Screen Share' : 'Screen Share'}
        </button>
        <button onClick={toggleBlackboard} className="control-btn">
          Blackboard
        </button>
        <button onClick={() => setShowChat(!showChat)} className="control-btn">
          {showChat ? 'Hide Chat' : 'Chat'}
        </button>
      </div>

      {showChat && (
        <div className="chat-overlay">
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className="message">
                <strong>{msg.sender}:</strong> {msg.message}
                <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
          <form onSubmit={sendChatMessage} className="chat-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}

      {showBlackboard && (
        <div className="blackboard-modal">
          <div className="blackboard-content">
            <h3>Blackboard</h3>
            <canvas width="600" height="400" className="blackboard-canvas"></canvas>
            <button onClick={toggleBlackboard}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMeetingRoom;