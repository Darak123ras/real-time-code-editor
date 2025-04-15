// src/components/Authentication/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && room.trim()) {
      login(username, room);
      navigate('/editor');
    }
  };

  return (
    <div className="login-container">
      <h2>Join Coding Room</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Room ID"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          required
        />
        <button type="submit">Join</button>
      </form>
      <p className="signup-link">
        Don't have an account? <span onClick={() => navigate('/signup')}>Sign up</span>
      </p>
    </div>
  );
};

export default Login;