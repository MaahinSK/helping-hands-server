import User from '../models/User.js'
import Event from '../models/Event.js'

// @desc    Sync user data from Firebase
// @route   POST /api/auth/sync-user
export const syncUser = async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body

    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and email are required' })
    }

    let user = await User.findOne({ uid })
    
    if (!user) {
      user = new User({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || ''
      })
      await user.save()
    } else {
      // Update user data if it exists
      user.displayName = displayName || user.displayName
      user.photoURL = photoURL || user.photoURL
      await user.save()
    }

    res.json(user)
  } catch (error) {
    console.error('Error syncing user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// @desc    Get user profile
// @route   GET /api/users/:uid
export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// @desc    Get events joined by user
// @route   GET /api/users/:uid/joined-events
export const getJoinedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      'participants.uid': req.params.uid
    }).sort({ eventDate: 1 })

    res.json(events)
  } catch (error) {
    console.error('Error fetching joined events:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}