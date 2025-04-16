// import React, { createContext, useContext, useEffect, useState } from "react";
// import io from "socket.io-client";

// const SocketContext = createContext();

// export const useSocket = () => useContext(SocketContext);

// export const SocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);
  

//   useEffect(() => {
//     const socketInstance = io("http://localhost:3001", {
//       autoConnect: false, // Don't connect until user is authenticated
//       withCredentials: true,
//     });
//     setSocket(socketInstance);

//     socketInstance.on("connect", () => {
//       console.log("✅ Connected to socket server:", socketInstance.id);
//     });

//     return () => {
//       socketInstance.disconnect();
//     };
//   }, []);

//   return (
//     <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
//   );
// };

import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    // Use import.meta.env instead of process.env in Vite
    const socketUrl = import.meta.env.VITE_API_URL || 
                    (window.location.hostname === 'localhost' ? 
                     'http://localhost:3001' : 
                     'https://real-time-code-editor-nll4.onrender.com');
    
                     const socketInstance = io(socketUrl, {
                      autoConnect: false,
                      withCredentials: true,
                      reconnection: true,
                      reconnectionAttempts: Infinity,
                      reconnectionDelay: 1000,
                      reconnectionDelayMax: 5000,
                      transports: ["websocket", "polling"],
                      path: "/socket.io",
                      secure: true // For HTTPS in production
                    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket server:", socketInstance.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    return () => {
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};