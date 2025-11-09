import express from 'express'
import { getJoinedEvents } from '../controllers/userController.js'

const router = express.Router()

router.get('/:uid/joined-events', getJoinedEvents)

export default router