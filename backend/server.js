/**
 * Server Entry Point
 * Main application file for CollabSphere backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/db');
const { errorHandler, asyncHandler } = require('./middleware/errorMiddleware');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// ==========================
// Database Connection
// ==========================
connectDB();

// ==========================
// Middleware Configuration
// ==========================

// CORS Configuration — allow all origins for local development
const corsOptions = {
  origin: true, // Reflects request origin, allowing file:// and any localhost port
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================
// Security & Logging
// ==========================

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// ==========================
// API Routes
// ==========================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ CollabSphere Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const joinRoutes = require('./routes/joinRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const messagingRoutes = require('./routes/messagingRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/join-requests', joinRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/messages', messagingRoutes);

// ==========================
// Socket.IO Setup
// ==========================

// Map to store online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[SOCKET] New user connected: ${socket.id}`);

  // User comes online
  socket.on('user:online', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('users:online', Array.from(onlineUsers.keys()));
    console.log(`[SOCKET] User ${userId} is online`);
  });

  // User sends a message
  socket.on('message:send', async (data) => {
    const { conversationId, senderId, recipientId, content, messageType, codeData } = data;
    console.log(`[SOCKET] Message from ${senderId} to conversation ${conversationId}`);
    
    // Broadcast to recipient and sender
    io.emit(`message:new:${conversationId}`, {
      conversationId,
      senderId,
      recipientId,
      content,
      messageType,
      codeData,
      timestamp: new Date(),
    });
  });

  // User marks messages as read
  socket.on('message:read', (conversationId) => {
    io.emit(`messages:read:${conversationId}`, { conversationId });
  });

  // Typing indicator
  socket.on('typing:start', (conversationId, userId) => {
    io.emit(`typing:${conversationId}`, { userId, isTyping: true });
  });

  socket.on('typing:stop', (conversationId, userId) => {
    io.emit(`typing:${conversationId}`, { userId, isTyping: false });
  });

  // User goes offline
  socket.on('user:offline', (userId) => {
    onlineUsers.delete(userId);
    io.emit('users:online', Array.from(onlineUsers.keys()));
    console.log(`[SOCKET] User ${userId} is offline`);
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('users:online', Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

// Make io accessible to routes
app.set('io', io);

// ==========================
// 404 Not Found Handler
// ==========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// ==========================
// Global Error Handler
// ==========================
app.use(errorHandler);

// ==========================
// Server Startup
// ==========================

const PORT = process.env.PORT || 5002;
const os = require('os');

// Get local IP address
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 CollabSphere Backend Server');
  console.log('='.repeat(50));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 External IP: http://${localIP}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💻 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔌 WebSocket enabled on port ${PORT}`);
  console.log('='.repeat(50) + '\n');
});

// ==========================
// Graceful Shutdown
// ==========================

process.on('SIGTERM', () => {
  console.log('\n⏳ SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⏳ SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
