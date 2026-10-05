require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/database');
const apiMonitor = require('./services/apiMonitor');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// اتصال به دیتابیس
connectDB();

// شروع مانیتورینگ API
apiMonitor;

// Routeها
app.use('/api/auth', require('./routes/auth'));
app.use('/api/video', require('./routes/video'));
app.use('/api/code', require('./routes/code'));
app.use('/api/crypto', require('./routes/crypto'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/education', require('./routes/education'));
app.use('/api/admin', require('./routes/admin'));

// Socket.IO برای نوتیفیکیشن زنده
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Super App is running!',
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`💾 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
