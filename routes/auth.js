import express from 'express'
import User from '../models/User.js'

const router = express.Router()

// Sync user data from Firebase to MongoDB
router.post('/sync-user', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body

    let user = await User.findOne({ uid })
    
    if (!user) {
      user = new User({
        uid,
        email,
        displayName,
        photoURL: photoURL || ''
      })
      await user.save()
    } else {
      // Update user data if it exists
      user.displayName = displayName
      user.photoURL = photoURL || user.photoURL
      await user.save()
    }

    res.json(user)
  } catch (error) {
    console.error('Error syncing user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router