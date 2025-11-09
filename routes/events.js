import express from 'express'
import Event from '../models/Event.js'

const router = express.Router()

// Get all upcoming events with filtering and search
router.get('/', async (req, res) => {
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
      currentPage: page,
      total
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single event
router.get('/:id', async (req, res) => {
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
})

// Create new event
router.post('/', async (req, res) => {
  try {
    const { title, description, eventType, thumbnail, location, eventDate, creator } = req.body

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
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update event
router.put('/:id', async (req, res) => {
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
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Join event
router.post('/:id/join', async (req, res) => {
  try {
    const { user } = req.body
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
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
})

// Get events created by user
router.get('/user/:uid', async (req, res) => {
  try {
    const events = await Event.find({ 'creator.uid': req.params.uid }).sort({ eventDate: 1 })
    res.json(events)
  } catch (error) {
    console.error('Error fetching user events:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router