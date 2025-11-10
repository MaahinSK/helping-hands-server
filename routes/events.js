// routes/events.js
import express from 'express'
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  joinEvent,
  getUserEvents
} from '../controllers/eventController.js'
import mongoose from 'mongoose'
import Event from '../models/Event.js'

const router = express.Router()

// Debug routes
router.get('/debug/status', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const stateText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbState];

    const totalEvents = await Event.countDocuments();
    
    res.json({
      database: {
        state: dbState,
        status: stateText,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      events: {
        total: totalEvents
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      database: {
        state: mongoose.connection.readyState,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/debug/test-user-events', async (req, res) => {
  try {
    const testUserId = 'aSTcU2CBp7Ri7pXun53Bb6nwZBl1';
    const events = await Event.find({ 'creator.uid': testUserId });
    
    res.json({
      userId: testUserId,
      eventsFound: events.length,
      events: events.map(e => ({
        id: e._id,
        title: e.title,
        creator: e.creator
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Your existing routes
router.get('/', getEvents)
router.get('/:id', getEvent)
router.post('/', createEvent)
router.put('/:id', updateEvent)
router.post('/:id/join', joinEvent)
router.get('/user/:uid', getUserEvents)

export default router