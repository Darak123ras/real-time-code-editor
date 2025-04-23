const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 1234 });

wss.on('connection', function connection(ws) {
  console.log('Y.js client connected');
  ws.on('close', () => console.log('Y.js client disconnected'));
});

console.log('Y.js server running on ws://localhost:1234');