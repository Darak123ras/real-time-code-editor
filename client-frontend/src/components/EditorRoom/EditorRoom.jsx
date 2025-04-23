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
  const [connectionError, setConnectionError] = useState(null);
  
  const connectionId = useRef(Date.now().toString());
  const editorRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Join room function with enhanced error handling
  const joinRoom = useCallback(() => {
    if (!socket || !user || !roomId || hasJoinedRoom) return;

    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    console.log('Joining room:', roomId);
    setConnectionError(null);
    
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
      } else {
        setConnectionError(response?.error || 'Failed to join room');
        // Retry after 3 seconds
        retryTimeoutRef.current = setTimeout(joinRoom, 3000);
      }
    });
  }, [socket, user, roomId, hasJoinedRoom]);

  // Handle mobile viewport
  useEffect(() => {
    const handleResize = () => {
      // Ensure proper mobile viewport scaling
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (window.innerWidth <= 768) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      } else {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Main socket effect with connection monitoring
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      if (isConnected) {
        joinRoom();
      }
    };

    const onDisconnect = () => {
      setHasJoinedRoom(false);
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
    socket.on('disconnect', onDisconnect);
    socket.on('code-update', handleCodeUpdate);
    socket.on('participants-update', handleParticipantsUpdate);
    socket.on('language-change', setLanguage);

    // Initial join if already connected
    if (isConnected) {
      joinRoom();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('code-update', handleCodeUpdate);
      socket.off('participants-update', handleParticipantsUpdate);
      socket.off('language-change', setLanguage);
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (hasJoinedRoom) {
        socket.emit('leave-room', { 
          roomId, 
          connectionId: connectionId.current 
        });
      }
    };
  }, [socket, isConnected, joinRoom, roomId, hasJoinedRoom]);
  // Render loading or error state
  if (!isConnected || !hasJoinedRoom) {
    return (
      <div className="connection-status">
        <p>Connecting to room {roomId}...</p>
        {connectionError && (
          <>
            <p className="error">{connectionError}</p>
            <p>Retrying...</p>
          </>
        )}
        <div className="connection-tips">
          <h4>Mobile Connection Tips:</h4>
          <ul>
            <li>Ensure you have stable internet connection</li>
            <li>Try switching between WiFi and mobile data</li>
            <li>Refresh the page if stuck for more than 10 seconds</li>
          </ul>
        </div>
      </div>
    );
  }

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