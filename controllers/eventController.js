import Event from '../models/Event.js'
import mongoose from 'mongoose'


// controllers/eventController.js
import Event from '../models/Event.js'
import mongoose from 'mongoose'

// @desc    Get events created by user
// @route   GET /api/events/user/:uid
export const getUserEvents = async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log('🔍 Fetching events for user:', uid);
    
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected');
      return res.status(500).json({ 
        error: 'Database temporarily unavailable',
        code: 'DATABASE_DISCONNECTED'
      });
    }

    const events = await Event.find({ 'creator.uid': uid })
      .sort({ eventDate: 1 })
      .lean();
    
    console.log(`✅ Found ${events.length} events for user ${uid}`);
    res.json(events);
    
  } catch (error) {
    console.error('❌ Error in getUserEvents:', error);
    
    // More specific error handling
    if (error.name === 'MongoNetworkError') {
      return res.status(500).json({ 
        error: 'Database connection failed',
        code: 'NETWORK_ERROR'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch user events',
      code: 'SERVER_ERROR'
    });
  }
}
// @desc    Get all events with filtering and pagination
// @route   GET /api/events
export const getEvents = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 12 } = req.query
    const currentDate = new Date()

    let query = { eventDate: { $gte: currentDate } }

    // Filter by event type
    if (type && type !== 'all') {
      query.eventType = type
    }

    // Search by title
    if (search) {
      query.$text = { $search: search }
    }

    const events = await Event.find(query)
      .sort({ eventDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Event.countDocuments(query)

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}




// @desc    Get single event
// @route   GET /api/events/:id
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    res.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// @desc    Create new event
// @route   POST /api/events
export const createEvent = async (req, res) => {
  try {
    const { title, description, eventType, thumbnail, location, eventDate, creator } = req.body

    // Validate required fields
    if (!title || !description || !eventType || !thumbnail || !location || !eventDate || !creator) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Validate event date is in future
    if (new Date(eventDate) <= new Date()) {
      return res.status(400).json({ error: 'Event date must be in the future' })
    }

    const event = new Event({
      title,
      description,
      eventType,
      thumbnail,
      location,
      eventDate,
      creator
    })

    await event.save()
    res.status(201).json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}

// @desc    Update event
// @route   PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    const { title, description, eventType, thumbnail, location, eventDate } = req.body

    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Validate event date is in future
    if (new Date(eventDate) <= new Date()) {
      return res.status(400).json({ error: 'Event date must be in the future' })
    }

    event.title = title
    event.description = description
    event.eventType = eventType
    event.thumbnail = thumbnail
    event.location = location
    event.eventDate = eventDate

    await event.save()
    res.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}

// @desc    Join event
// @route   POST /api/events/:id/join
export const joinEvent = async (req, res) => {
  try {
    const { user } = req.body
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Check if event date has passed
    if (new Date(event.eventDate) < new Date()) {
      return res.status(400).json({ error: 'Cannot join past events' })
    }

    // Check if user is already joined
    const alreadyJoined = event.participants.some(participant => participant.uid === user.uid)
    if (alreadyJoined) {
      return res.status(400).json({ error: 'Already joined this event' })
    }

    event.participants.push({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    })

    await event.save()
    res.json(event)
  } catch (error) {
    console.error('Error joining event:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// @desc    Get events created by user
// @route   GET /api/events/user/:uid
export const getUserEvents = async (req, res) => {
  try {
    const events = await Event.find({ 'creator.uid': req.params.uid }).sort({ eventDate: 1 })
    res.json(events)
  } catch (error) {
    console.error('Error fetching user events:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}