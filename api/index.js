import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Enhanced CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175', 
      'http://localhost:3000',
      'https://helping-hands-client.vercel.app',
      process.env.CLIENT_URL
    ].filter(Boolean);

    // Allow all localhost ports and specific domains
    if (allowedOrigins.some(allowed => origin.startsWith('http://localhost')) || 
        allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// Handle preflight requests for all routes
app.options('*', cors());

// Middleware
app.use(helmet());
app.use(
  cors({
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
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection logic
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    isConnected = true;
    return;
  }

  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.log('❌ Max connection attempts reached');
    return;
  }

  connectionAttempts++;

  try {
    console.log(`🔄 Connecting to MongoDB (attempt ${connectionAttempts})...`);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = mongoose.connection.readyState === 1;

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);

    if (error.name === 'MongoServerSelectionError') {
      console.log('🔧 Hint: Network/firewall issue or wrong connection string');
    }
    if (error.name === 'MongoParseError') {
      console.log('🔧 Hint: Check your MONGODB_URI format');
    }
  }
};

// --- Debug Routes ---
app.get('/api/debug-db', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  let canQuery = false;

  if (dbState === 1) {
    try {
      const db = mongoose.connection.db;
      await db.listCollections().toArray();
      canQuery = true;
    } catch (err) {
      console.log('Query test failed:', err.message);
    }
  }

  res.json({
    mongoDB: {
      readyState: dbState,
      status: states[dbState] || 'unknown',
      isConnected: dbState === 1,
      canQuery,
      connectionAttempts,
    },
    environment: {
      hasMongoURI: !!process.env.MONGODB_URI,
      mongoURILength: process.env.MONGODB_URI
        ? process.env.MONGODB_URI.length
        : 0,
      nodeEnv: process.env.NODE_ENV,
      hasClientURL: !!process.env.CLIENT_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

// --- Root route ---
app.get('/', (req, res) => {
  res.json({
    message: 'Helping Hands Server API',
    status: 'Running on Vercel',
    database:
      mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health',
      'GET /api/debug-db',
      'GET /api/events',
      'POST /api/auth/sync-user',
      'GET /api/events/user/:uid',
      'GET /api/users/:uid/joined-events',
    ],
  });
});

// --- Health check ---
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.json({
    message: 'Server is healthy 🚀',
    database: {
      status: states[dbState] || 'unknown',
      readyState: dbState,
      connected: dbState === 1,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// --- Import your routes ---
import authRoutes from '../routes/auth.js';
import eventRoutes from '../routes/events.js';
import userRoutes from '../routes/users.js';

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// --- 404 handler ---
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
      'GET /api/users/:uid/joined-events',
    ],
  });
});

// --- Error handler ---
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : error.message,
  });
});

// ✅ Vercel-compatible export
export default async function handler(req, res) {
  if (!isConnected) {
    await connectDB();
  }
  return app(req, res);
}
