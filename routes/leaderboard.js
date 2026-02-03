const express = require('express');
const router = express.Router();
const { validateScore, validatePlayerId } = require('../middleware/validation');
const { updateScore, getLeaderboard, getPlayerRank } = require('../controllers/leaderboardController');

// POST /api/score - Update player score
router.post('/score', validateScore, updateScore);

// GET /api/leaderboard - Get top players
router.get('/leaderboard', getLeaderboard);

// GET /api/rank/:playerId - Get specific player's rank
router.get('/rank/:playerId', validatePlayerId, getPlayerRank);

module.exports = router;