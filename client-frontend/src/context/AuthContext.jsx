// src/context/AuthContext.js
import { createContext, useContext, useState } from 'react';
import { useSocket } from './SocketContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const socket = useSocket();

  const signup = (username, email, password) => {
    // In a real app, you would call your backend API here
    console.log('Signing up:', { username, email, password });
    return Promise.resolve(true); // Simulate successful signup
  };

  const login = (username, room) => {
    setUser({ username, room });
    socket.auth = { username, room };
    socket.connect();
  };

  const logout = () => {
    socket.disconnect();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};