import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['Cleanup', 'Plantation', 'Donation', 'Education', 'Healthcare', 'Other']
  },
  thumbnail: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  creator: {
    uid: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    photoURL: String
  },
  participants: [{
    uid: String,
    email: String,
    displayName: String,
    photoURL: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

eventSchema.index({ eventDate: 1 })
eventSchema.index({ eventType: 1 })
eventSchema.index({ title: 'text' })

export default mongoose.model('Event', eventSchema)