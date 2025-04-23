import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import Editor from '@monaco-editor/react';
import './EditorRoom.css';

const EditorRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [code, setCode] = useState('// Start coding together...\n');
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  
  const connectionId = useRef(Date.now().toString());
  const editorRef = useRef(null);

  // Join room function
  const joinRoom = useCallback(() => {
    if (!socket || !user || !roomId || hasJoinedRoom) return;

    console.log('Joining room:', roomId);
    
    socket.emit('join-room', { 
      roomId, 
      username: user.username,
      connectionId: connectionId.current
    }, (response) => {
      console.log('Join response:', response);

      if (response?.success) {
        setCode(response.code);
        setLanguage(response.language);
        setParticipants(response.participants);
        setHasJoinedRoom(true);
      }
    });
  }, [socket, user, roomId, hasJoinedRoom]);

  // Handle code changes
  const handleCodeChange = useCallback((newCode) => {
    if (!socket || !hasJoinedRoom) return;
    setCode(newCode);
    socket.emit('code-update', { 
      roomId, 
      code: newCode,
      senderId: connectionId.current 
    });
  }, [socket, roomId, hasJoinedRoom]);

  // Handle language changes
  const handleLanguageChange = (newLanguage) => {
    if (!socket || !hasJoinedRoom) return;
    setLanguage(newLanguage);
    socket.emit('language-change', { roomId, language: newLanguage });
  };

  // Leave room function
  const leaveRoom = useCallback(() => {
    if (!socket || !hasJoinedRoom) return;
    
    socket.emit('leave-room', { 
      roomId, 
      connectionId: connectionId.current 
    }, () => {
      navigate('/home');
    });
  }, [socket, roomId, navigate, hasJoinedRoom]);

  // Main socket effect
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      if (isConnected) {
        joinRoom();
      }
    };

    const handleCodeUpdate = (newCode, senderId) => {
      if (senderId !== connectionId.current) {
        setCode(newCode);
      }
    };

    const handleParticipantsUpdate = (updatedParticipants) => {
      setParticipants(updatedParticipants);
    };

    socket.on('connect', onConnect);
    socket.on('code-update', handleCodeUpdate);
    socket.on('participants-update', handleParticipantsUpdate);
    socket.on('language-change', setLanguage);

    // Initial join if already connected
    if (isConnected) {
      joinRoom();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('code-update', handleCodeUpdate);
      socket.off('participants-update', handleParticipantsUpdate);
      socket.off('language-change', setLanguage);
      
      if (hasJoinedRoom) {
        socket.emit('leave-room', { 
          roomId, 
          connectionId: connectionId.current 
        });
      }
    };
  }, [socket, isConnected, joinRoom, roomId, hasJoinedRoom]);

  // Render participants
  const renderParticipants = () => {
    return (
      <ul>
        {participants.map((p) => (
          <li key={`${p.connectionId}-${p.username}`}>
            {p.username} {p.connectionId === connectionId.current ? '(You)' : ''}
          </li>
        ))}
      </ul>
    );
  };

  if (!isConnected || !hasJoinedRoom) {
    return (
      <div className="connection-status">
        <p>Connecting to room {roomId}...</p>
      </div>
    );
  }

  return (
    <div className="editor-room">
      <div className="room-header">
        <h2>Room: {roomId}</h2>
        
        <div className="participants">
          <h3>Participants:</h3>
          {renderParticipants()}
        </div>

        <div className="language-selector">
          <select 
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c++">C++</option>
          </select>
        </div>
        <button onClick={leaveRoom}>Leave Room</button>
      </div>

      <Editor
        height="80vh"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={handleCodeChange}
        options={{
          fontSize: 14,
          automaticLayout: true,
          minimap: { enabled: false }
        }}
      />
    </div>
  );
};

export default EditorRoom;