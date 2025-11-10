// server.js
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import connectDB from './config/database.js'
import errorHandler from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import eventRoutes from './routes/events.js'
import userRoutes from './routes/users.js'

dotenv.config()

const app = express()

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:3000',
      'https://helping-hands-client.vercel.app',
      process.env.CLIENT_URL
    ].filter(Boolean);

    if (allowedOrigins.some(allowed => origin.startsWith('http://localhost')) || 
        allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.options('*', cors());

// Other middleware
app.use(helmet())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check that doesn't require DB
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    message: 'Server is running!',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Connect to MongoDB and then setup routes
const initializeServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected, setting up routes...');
    
    // Routes (mounted after DB connection)
    app.use('/api/auth', authRoutes)
    app.use('/api/events', eventRoutes)
    app.use('/api/users', userRoutes)

    // 404 handler
    app.all('*', (req, res) => {
      res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Error handler (should be last)
    app.use(errorHandler);
    
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    
    // Setup routes even if DB fails (for graceful degradation)
    app.use('/api/auth', authRoutes)
    app.use('/api/events', eventRoutes)
    app.use('/api/users', userRoutes)

    app.all('*', (req, res) => {
      res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    app.use(errorHandler);
  }
};

// Initialize the server
initializeServer();

export default app;