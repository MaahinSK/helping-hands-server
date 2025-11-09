// Middleware to verify Firebase tokens (if you want to add extra security)
// import admin from 'firebase-admin'

// Initialize Firebase Admin (optional - for additional server-side auth)
// You'll need to set up Firebase Admin SDK for this

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // If using Firebase Admin SDK
    // const decodedToken = await admin.auth().verifyIdToken(token)
    // req.user = decodedToken
    
    next()
  } catch (error) {
    console.error('Token verification error:', error)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export default verifyToken