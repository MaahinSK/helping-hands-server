import express from 'express'
import Event from '../models/Event.js'

const router = express.Router()

// Get events joined by user
router.get('/:uid/joined-events', async (req, res) => {
  try {
    const events = await Event.find({
      'participants.uid': req.params.uid
    }).sort({ eventDate: 1 })

    res.json(events)
  } catch (error) {
    console.error('Error fetching joined events:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router