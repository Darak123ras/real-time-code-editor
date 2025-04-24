const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Add this before your routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
const io = new Server(server, {
  cors: {
    origin: "*",
    // [ 
    //   "http://localhost:5173",
    //   "https://real-time-code-editor-gold.vercel.app/",
    //   "https://real-time-code-editor-nll4.onrender.com"
    // ],
    methods: ["GET", "POST"],
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 5 * 60 * 1000, // 5 minutes
    skipMiddlewares: true
  },
  // transports: ['websocket'],
  pingInterval: 25000,
  pingTimeout: 20000
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Join room handler
  socket.on('join-room', ({ roomId, username, connectionId }, callback) => {
    try {
      if (!roomId || !username) {
        throw new Error('Room ID and username are required');
      }

      // Initialize room if needed
      if (!rooms[roomId]) {
        rooms[roomId] = {
          code: '// Start coding...\n',
          language: 'javascript',
          participants: []
        };
      }

      const room = rooms[roomId];

      // Check if participant already exists
      const existingIndex = room.participants.findIndex(
        p => p.connectionId === connectionId
      );

      if (existingIndex >= 0) {
        // Update existing participant
        room.participants[existingIndex] = {
          ...room.participants[existingIndex],
          id: socket.id,
          isActive: true,
          lastActive: new Date()
        };
      } else {
        // Add new participant
        room.participants.push({
          id: socket.id,
          connectionId,
          username,
          joinedAt: new Date(),
          lastActive: new Date(),
          isActive: true
        });
      }

      // Join the room
      socket.join(roomId);

      callback({
        success: true,
        code: room.code,
        language: room.language,
        participants: room.participants.filter(p => p.isActive)
      });

      // Broadcast to all in room
      io.to(roomId).emit('participants-update', 
        room.participants.filter(p => p.isActive)
      );

    } catch (err) {
      callback({ error: err.message });
    }
  });

  // Handle code updates
  socket.on('code-update', ({ roomId, code, senderId }) => {
    if (rooms[roomId]) {
      rooms[roomId].code = code;
      // Broadcast to all except sender
      socket.to(roomId).emit('code-update', code, senderId);
    }
  });

  // Handle language changes
  socket.on('language-change', ({ roomId, language }) => {
    if (rooms[roomId]) {
      rooms[roomId].language = language;
      io.to(roomId).emit('language-change', language);
    }
  });

  // Leave room handler
  socket.on('leave-room', ({ roomId, connectionId }, callback) => {
    if (rooms[roomId]) {
      const participantIndex = rooms[roomId].participants.findIndex(
        p => p.connectionId === connectionId
      );
      
      if (participantIndex >= 0) {
        rooms[roomId].participants.splice(participantIndex, 1);
        
        // Broadcast updated participant list
        io.to(roomId).emit('participants-update', 
          rooms[roomId].participants.filter(p => p.isActive)
        );
        
        if (callback) callback({ success: true });
        
        if (rooms[roomId].participants.length === 0) {
          delete rooms[roomId];
        }
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    Object.keys(socket.rooms).forEach(roomId => {
      if (roomId !== socket.id && rooms[roomId]) {
        const participantIndex = rooms[roomId].participants.findIndex(
          p => p.id === socket.id
        );
        
        if (participantIndex >= 0) {
          rooms[roomId].participants.splice(participantIndex, 1);
          
          io.to(roomId).emit('participants-update', 
            rooms[roomId].participants.filter(p => p.isActive)
          );
          
          if (rooms[roomId].participants.length === 0) {
            delete rooms[roomId];
          }
        }
      }
    });
  });

  // Periodic cleanup (every 5 minutes)
  setInterval(() => {
    const now = new Date();
    Object.keys(rooms).forEach(roomId => {
      rooms[roomId].participants = rooms[roomId].participants.filter(p => {
        return p.isActive || (now - new Date(p.lastActive)) < 5 * 60 * 1000;
      });
      
      if (rooms[roomId].participants.length === 0) {
        delete rooms[roomId];
      }
    });
  }, 5 * 60 * 1000);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io endpoint: ws://localhost:${PORT}`);
});