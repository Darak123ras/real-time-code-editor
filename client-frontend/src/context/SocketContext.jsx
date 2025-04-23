import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Detect mobile devices for connection settings
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const socketInstance = io('http://localhost:3001', {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: isMobile ? 3000 : 1000, // Longer delay for mobile
      reconnectionDelayMax: isMobile ? 10000 : 5000,
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
      closeOnBeforeunload: false,
      upgrade: false, // Force WebSocket only
      rememberUpgrade: true,
      timeout: isMobile ? 20000 : 10000 // Longer timeout for mobile
    });

    const onConnect = () => {
      setIsConnected(true);
      console.log('✅ Socket connected:', socketInstance.id);
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      console.log('⚠️ Socket disconnected:', reason);
    };

    const onConnectError = (error) => {
      console.error('❌ Connection error:', error);
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onConnectError);

    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onConnectError);
      socketInstance.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);