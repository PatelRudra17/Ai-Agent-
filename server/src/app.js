require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Security headers
app.use(helmet());

// Compression (gzip responses > 1KB)
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// NoSQL injection prevention (manual — req.query is read-only in Express 5)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/calls', require('./routes/calls.routes'));
app.use('/api/messages', require('./routes/messages.routes'));
app.use('/api/tasks', require('./routes/tasks.routes'));
app.use('/api/meetings', require('./routes/meetings.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/documents', require('./routes/documents.routes'));
app.use('/api/hr', require('./routes/hr.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/chat', require('./routes/chat.routes'));

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Cron jobs
const { startDailyReportCron } = require('./cron/dailyReport.cron');
const { startWeeklySummaryCron } = require('./cron/weeklySummary.cron');
const { startSalaryCron } = require('./cron/salaryCron');

// Start
const PORT = process.env.PORT || 4000;
const start = async () => {
  await connectDB();
  startDailyReportCron();
  startWeeklySummaryCron();
  startSalaryCron();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};
start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  console.log('SIGINT received — shutting down');
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});
