// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      error: 'Validation Error',
      messages: messages,
      code: 'VALIDATION_ERROR'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate field value entered',
      code: 'DUPLICATE_KEY'
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Resource not found',
      code: 'INVALID_ID'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    code: 'INTERNAL_ERROR'
  });
};

export default errorHandler;