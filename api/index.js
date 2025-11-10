// api/index.js - Step 1: Basic Express with routes
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

// Basic middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  })
})

// Test routes without database
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working', status: 'success' })
})

app.get('/api/events/test', (req, res) => {
  res.json({ message: 'Events route working', events: [] })
})

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  })
})

export default app