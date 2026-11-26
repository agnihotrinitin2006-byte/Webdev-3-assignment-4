const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// 1. Load Environment Variables from .env
dotenv.config();

// 2. Import Database Connection and Event Listeners
const connectDB = require('./config/db');
const { initEventListeners } = require('./events/eventEmitter');

// 3. Import Routes
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 4. Import Middlewares
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// 5. Import Socket Handler
const initChatSocket = require('./sockets/chatSocket');

// Initialize MongoDB connection
connectDB();

// Initialize EventEmitter subscribers
initEventListeners();

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO instance attached to HTTP server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Configure Socket.IO event handlers
initChatSocket(io);

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve built-in interactive frontend client from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Health Check & Root Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Secure Connect and Communication Platform API is running smoothly.',
    timestamp: new Date()
  });
});

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Define Port and Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==============================================================`);
  console.log(`🚀 [SERVER RUNNING]: http://localhost:${PORT}`);
  console.log(`📡 [ENVIRONMENT]   : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️  [PLATFORM]      : Secure Connect and Communication Platform`);
  console.log(`==============================================================\n`);
});
