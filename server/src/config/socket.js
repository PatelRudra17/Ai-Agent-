const { Server } = require('socket.io');

let io;

// Track online users: userId → socketId
const onlineUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user to their own room for targeted notifications
    socket.on('join', (userId) => {
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      io.emit('user:online', { userId });
      console.log(`User ${userId} joined room`);
    });

    // ===== WebRTC Signaling =====

    // Initiate call: forward SDP offer to recipient
    socket.on('call:initiate', ({ targetUserId, offer, callerInfo }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      if (targetSocket) {
        io.to(targetUserId).emit('call:incoming', {
          offer,
          callerInfo,
          callerSocketId: socket.id,
        });
      } else {
        socket.emit('call:user-offline', { targetUserId });
      }
    });

    // Answer call: forward SDP answer to caller
    socket.on('call:answer', ({ callerUserId, answer }) => {
      io.to(callerUserId).emit('call:answered', { answer });
    });

    // ICE candidate exchange
    socket.on('call:ice-candidate', ({ targetUserId, candidate }) => {
      io.to(targetUserId).emit('call:ice-candidate', { candidate });
    });

    // Reject call
    socket.on('call:reject', ({ callerUserId }) => {
      io.to(callerUserId).emit('call:rejected');
    });

    // End call
    socket.on('call:end', ({ targetUserId }) => {
      io.to(targetUserId).emit('call:ended');
    });

    // ===== Team Chat =====

    socket.on('chat:message', ({ roomId, message }) => {
      // Broadcast to all users in the room (by room participants)
      socket.to(roomId).emit('chat:message', { roomId, message });
    });

    socket.on('chat:typing', ({ roomId, userName }) => {
      socket.to(roomId).emit('chat:typing', { roomId, userName });
    });

    socket.on('chat:join-room', (roomId) => {
      socket.join(roomId);
    });

    // ===== Disconnect =====

    socket.on('disconnect', () => {
      // Find and remove user from onlineUsers
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit('user:offline', { userId });
          break;
        }
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const getOnlineUsers = () => Array.from(onlineUsers.keys());

module.exports = { initSocket, getIO, getOnlineUsers };
