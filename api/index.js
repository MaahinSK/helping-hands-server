import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

// MongoDB connection with better error handling
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return;
  }

  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.log('❌ Max connection attempts reached');
    return;
  }

  connectionAttempts++;
  
  try {
    console.log(`🔄 MongoDB connection attempt ${connectionAttempts}...`);
    
    // Simple connection without complex options
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Log more details about the error
    if (error.name === 'MongoServerSelectionError') {
      console.log('🔧 This is usually a network/firewall issue');
    }
    
    if (error.name === 'MongoParseError') {
      console.log('🔧 Check your MONGODB_URI format');
    }
  }
};

// Connect to MongoDB
connectDB();

// Debug route - ADD THIS
app.get('/api/debug-db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    // Test if we can actually query the database
    let canQuery = false;
    if (dbState === 1) {
      try {
        // Try a simple query to verify connection works
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        canQuery = true;
      } catch (queryError) {
        console.log('Query test failed:', queryError.message);
      }
    }
    
    res.json({
      mongoDB: {
        readyState: dbState,
        status: states[dbState] || 'unknown',
        isConnected: dbState === 1,
        canQuery: canQuery,
        connectionAttempts: connectionAttempts
      },
      environment: {
        hasMongoURI: !!process.env.MONGODB_URI,
        mongoURILength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
        nodeEnv: process.env.NODE_ENV,
        hasClientURL: !!process.env.CLIENT_URL
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug failed',
      message: error.message
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Helping Hands Server API',
    status: 'Running on Vercel',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health',
      'GET /api/debug-db',
      'GET /api/events',
      'POST /api/auth/sync-user',
      'GET /api/events/user/:uid',
      'GET /api/users/:uid/joined-events'
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'Disconnected';
  
  switch(dbState) {
    case 0: dbStatus = 'Disconnected'; break;
    case 1: dbStatus = 'Connected'; break;
    case 2: dbStatus = 'Connecting'; break;
    case 3: dbStatus = 'Disconnecting'; break;
  }

  res.json({
    message: 'Server is healthy! 🚀',
    database: {
      status: dbStatus,
      readyState: dbState,
      connected: dbState === 1
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import and use your routes
import authRoutes from '../routes/auth.js';
import eventRoutes from '../routes/events.js';
import userRoutes from '../routes/users.js';

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// 404 handler - UPDATE THIS to include debug-db
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/debug-db',
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