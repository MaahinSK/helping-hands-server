import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
let isDbConnected = false;

const connectDB = async () => {
  if (isDbConnected) {
    return;
  }

  try {
    console.log('Connecting to MongoDB...');
    
    // Simple connection for Vercel
    await mongoose.connect(process.env.MONGODB_URI);
    
    isDbConnected = true;
    console.log('✅ MongoDB connected successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isDbConnected = false;
  }
};

// Connect to MongoDB
connectDB();

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Helping Hands Server API',
    status: 'Running on Vercel',
    database: isDbConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health',
      'GET /api/test',
      'GET /api/events',
      'POST /api/auth/sync-user',
      'GET /api/events/user/:uid',
      'GET /api/users/:uid/joined-events'
    ]
  });
});

// Health check with DB status
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Server is healthy! 🚀',
    database: isDbConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import and use your actual routes
import authRoutes from '../routes/auth.js';
import eventRoutes from '../routes/events.js';
import userRoutes from '../routes/users.js';

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/events',
      'POST /api/auth/sync-user',
      'GET /api/events/user/:uid',
      'GET /api/users/:uid/joined-events'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

export default app;