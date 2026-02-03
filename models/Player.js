const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  playerName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Player', playerSchema);