// Import necessary modules
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store active rooms and connected peers
const rooms = {};

// Handle client connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', (roomId) => {
    console.log(`User ${socket.id} joining room: ${roomId}`);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    rooms[roomId].push(socket.id);

    // Notify other users in the room
    socket.join(roomId);
    socket.to(roomId).emit('peerStream', socket.id);
  });

  socket.on('leaveRoom', (roomId) => {
    console.log(`User ${socket.id} leaving room: ${roomId}`);

    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }

    socket.leave(roomId);
    socket.to(roomId).emit('peerDisconnected', socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        socket.to(roomId).emit('peerDisconnected', socket.id);
      }
    }
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
