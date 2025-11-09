import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Helping Hands Server API',
    status: 'Running on Vercel',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health',
      'GET /api/test',
      'GET /api/events'
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Server is healthy! 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test successful!',
    data: {
      items: ['event1', 'event2', 'event3'],
      count: 3
    }
  });
});

// Events route (mock data)
app.get('/api/events', (req, res) => {
  res.json({
    events: [
      {
        id: 1,
        title: 'Community Cleanup',
        type: 'Cleanup',
        location: 'Central Park',
        date: '2024-12-01'
      },
      {
        id: 2,
        title: 'Tree Plantation Drive',
        type: 'Plantation', 
        location: 'City Gardens',
        date: '2024-12-05'
      }
    ],
    total: 2
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /api/health', 
      'GET /api/test',
      'GET /api/events'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

export default app;