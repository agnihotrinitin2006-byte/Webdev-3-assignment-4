const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { appEventEmitter } = require('../events/eventEmitter');

/**
 * Socket.IO Chat Module with JWT Authentication
 * Handles real-time communication, room management, typing indicators, and message persistence.
 */
const initChatSocket = (io) => {
  // 1. Socket.IO Authentication Middleware
  io.use(async (socket, next) => {
    try {
      // Extract token from handshake auth or query or headers
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: Missing JWT token.'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify user exists in database
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found.'));
      }

      // Attach user details to the socket instance for subsequent event handlers
      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      console.error(`[Socket Auth Error]: ${error.message}`);
      return next(new Error('Authentication error: Invalid or expired token.'));
    }
  });

  // 2. Socket Connection Event
  io.on('connection', (socket) => {
    console.log(`[Socket Connected]: Socket ID -> ${socket.id}, User -> ${socket.user.name} (${socket.user.email})`);

    // 3. Event: joinRoom
    socket.on('joinRoom', async ({ roomId }) => {
      try {
        if (!roomId || typeof roomId !== 'string') {
          return socket.emit('error', { message: 'Invalid roomId provided.' });
        }

        const cleanRoom = roomId.trim();
        socket.join(cleanRoom);
        console.log(`[Socket Room]: User ${socket.user.name} joined room: "${cleanRoom}"`);

        // Fetch recent message history (last 50 messages)
        const history = await Message.find({ roomId: cleanRoom })
          .sort({ createdAt: 1 })
          .limit(50);

        // Send history directly to the joining socket
        socket.emit('roomHistory', {
          roomId: cleanRoom,
          messages: history
        });

        // Notify other room members that a user joined
        socket.to(cleanRoom).emit('userJoined', {
          roomId: cleanRoom,
          user: {
            id: socket.user.id,
            name: socket.user.name
          },
          message: `${socket.user.name} has joined the room.`
        });
      } catch (err) {
        console.error(`[Socket joinRoom Error]: ${err.message}`);
        socket.emit('error', { message: 'Could not join chat room.' });
      }
    });

    // 4. Event: sendMessage
    socket.on('sendMessage', async ({ roomId, message }) => {
      try {
        if (!roomId || !message || !message.trim()) {
          return socket.emit('error', { message: 'RoomId and non-empty message are required.' });
        }

        const cleanRoom = roomId.trim();
        const cleanMessage = message.trim();

        // Save message document in MongoDB
        const savedMessage = await Message.create({
          senderId: socket.user.id,
          senderName: socket.user.name,
          roomId: cleanRoom,
          message: cleanMessage,
          createdAt: new Date()
        });

        // Prepare message payload
        const messagePayload = {
          _id: savedMessage._id,
          senderId: savedMessage.senderId,
          senderName: savedMessage.senderName,
          roomId: savedMessage.roomId,
          message: savedMessage.message,
          createdAt: savedMessage.createdAt
        };

        // Broadcast to all sockets in the room (including sender)
        io.to(cleanRoom).emit('receiveMessage', messagePayload);

        // Emit application event via EventEmitter
        appEventEmitter.emit('messageSent', {
          senderId: socket.user.id,
          senderName: socket.user.name,
          roomId: cleanRoom,
          message: cleanMessage
        });
      } catch (err) {
        console.error(`[Socket sendMessage Error]: ${err.message}`);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // 5. Event: typing
    socket.on('typing', ({ roomId, isTyping }) => {
      if (roomId) {
        socket.to(roomId.trim()).emit('typing', {
          roomId: roomId.trim(),
          userName: socket.user.name,
          userId: socket.user.id,
          isTyping: Boolean(isTyping)
        });
      }
    });

    // 6. Event: disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[Socket Disconnected]: Socket ID -> ${socket.id}, User -> ${socket.user.name}, Reason -> ${reason}`);
    });
  });
};

module.exports = initChatSocket;
