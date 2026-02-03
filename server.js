 require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Connect to Redis
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

redisClient.on('error', err => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('✓ Redis connected'));

redisClient.connect();

// Make Redis client available to routes
app.locals.redisClient = redisClient;

// Routes
app.use('/api', leaderboardRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
