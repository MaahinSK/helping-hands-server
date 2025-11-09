import express from 'express'
import { syncUser, getUser } from '../controllers/userController.js'

const router = express.Router()

// Sync user data from Firebase to MongoDB
router.post('/sync-user', syncUser)

// Get user profile
router.get('/user/:uid', getUser)

export default router