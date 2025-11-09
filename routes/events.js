import express from 'express'
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  joinEvent,
  getUserEvents
} from '../controllers/eventController.js'

const router = express.Router()

router.get('/', getEvents)
router.get('/:id', getEvent)
router.post('/', createEvent)
router.put('/:id', updateEvent)
router.post('/:id/join', joinEvent)
router.get('/user/:uid', getUserEvents)

export default router