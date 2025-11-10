// api/index.js - Minimal working server
import express from 'express'

const app = express()

// Basic middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Simple health check without any dependencies
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  })
})

// Test route without database
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' })
})

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  })
})

// Export for Vercel
export default app