import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="home-container">
      <div className="container">
          <h2>Welcome, {user?.username}!</h2>
          
          <button onClick={createRoom}>Create New Room</button>
          
          <div className="join-room">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            />
            <button onClick={joinRoom}>Join Room</button>
          </div>
      </div>
    </div>
  );
};

export default Home;