const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedVercelPreview = (origin) => {
  try {
    const url = new URL(origin);
    // Allow Vercel preview URLs for this project (e.g. lap-pharma-<hash>-<scope>.vercel.app)
    return url.hostname.endsWith('.vercel.app') && url.hostname.startsWith('lap-pharma');
  } catch {
    return false;
  }
};

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isAllowedVercelPreview(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/semesters',   require('./routes/semesters'));
app.use('/api/subjects',    require('./routes/subjects'));
app.use('/api/labs',        require('./routes/labs'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/solutions',   require('./routes/solutions'));
app.use('/api/equipment',   require('./routes/equipment'));
app.use('/api/attendance',  require('./routes/attendance'));
app.use('/api/records',     require('./routes/records'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Pharma Lab API running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => { console.error('DB connection error:', err); process.exit(1); });

module.exports = app;
