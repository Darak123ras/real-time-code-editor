import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  

  useEffect(() => {
    const socketInstance = io("http://localhost:3001", {
      autoConnect: false, // Don't connect until user is authenticated
      withCredentials: true,
    });
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket server:", socketInstance.id);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};