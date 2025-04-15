// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true
}));
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"], // Your React app's URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

const roomData = {};

const users = [];

io.on('connection', (socket) => {
    // Handle signup
  socket.on('signup', ({ username, email, password }, callback) => {
    if (users.some(u => u.username === username)) {
      return callback({ error: 'Username already exists' });
    }
    users.push({ username, email, password });
    callback({ success: true });
  });

   // Handle login
   socket.on('login', ({ username, room }, callback) => {
    const user = users.find(u => u.username === username);
    if (!user) {
      return callback({ error: 'User not found' });
    }
    socket.join(room);
    callback({ success: true });
  });




  console.log('User connected:', socket.id);

  const { username, room } = socket.handshake.auth;
  if (!username || !room) {
    socket.disconnect();
    return;
  }

  socket.join(room);
  
  // Initialize room if it doesn't exist
  if (!roomData[room]) {
    roomData[room] = {
      code: '// Start coding...',
      language: 'javascript',
      users: []
    };
  }

  // Add user to room
  roomData[room].users.push({ id: socket.id, username });

  // Send current room state to new user
  socket.emit('init', {
    code: roomData[room].code,
    language: roomData[room].language
  });

  // Notify other users in the room
  socket.to(room).emit('user-joined', username);

  // Handle code updates
  socket.on('code-update', (newCode) => {
    roomData[room].code = newCode;
    socket.to(room).emit('code-update', newCode);
  });

  // Handle language changes
  socket.on('language-change', (newLanguage) => {
    roomData[room].language = newLanguage;
    socket.to(room).emit('language-change', newLanguage);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (roomData[room]) {
      roomData[room].users = roomData[room].users.filter(user => user.id !== socket.id);
      socket.to(room).emit('user-left', username);
      
      // Clean up room if empty
      if (roomData[room].users.length === 0) {
        delete roomData[room];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



