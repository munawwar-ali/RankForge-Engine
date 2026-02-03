const Player = require('../models/Player');

// Update player score
const updateScore = async (req, res) => {
  try {
    const { playerId, playerName, score } = req.body;
    const redisClient = req.app.locals.redisClient;

    // Update or create player in MongoDB
    const player = await Player.findOneAndUpdate(
      { playerId },
      { playerName, score, lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    // Update Redis sorted set
    await redisClient.zAdd('leaderboard', { score: score, value: playerId });

    res.json({ 
      success: true, 
      message: 'Score updated successfully',
      player: {
        playerId: player.playerId,
        playerName: player.playerName,
        score: player.score
      }
    });
  } catch (error) {
    console.error('Error updating score:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false,
        error: 'Player already exists with different details'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update score. Please try again later.'
    });
  }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    // Validate limit parameter
    if (limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: 'Limit must be between 1 and 1000'
      });
    }
    
    const redisClient = req.app.locals.redisClient;

    // Get top players from Redis (descending order)
    const topPlayers = await redisClient.zRangeWithScores('leaderboard', 0, limit - 1, { REV: true });

    if (topPlayers.length === 0) {
      return res.json({
        success: true,
        count: 0,
        leaderboard: [],
        message: 'No players found'
      });
    }

    // Get player details from MongoDB
    const playerIds = topPlayers.map(p => p.value);
    const players = await Player.find({ playerId: { $in: playerIds } });

    // Create a map for quick lookup
    const playerMap = {};
    players.forEach(p => {
      playerMap[p.playerId] = p;
    });

    // Combine data
    const leaderboard = topPlayers.map((item, index) => ({
      rank: index + 1,
      playerId: item.value,
      playerName: playerMap[item.value]?.playerName || 'Unknown',
      score: item.score
    }));

    res.json({ 
      success: true,
      count: leaderboard.length,
      leaderboard 
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch leaderboard. Please try again later.'
    });
  }
};

// Get player rank
const getPlayerRank = async (req, res) => {
  try {
    const { playerId } = req.params;
    const redisClient = req.app.locals.redisClient;

    // Get player's rank from Redis (0-based, so add 1)
    const rank = await redisClient.zRevRank('leaderboard', playerId);

    if (rank === null) {
      return res.status(404).json({ 
        success: false,
        error: 'Player not found',
        message: `No player exists with ID: ${playerId}`
      });
    }

    // Get player's score
    const score = await redisClient.zScore('leaderboard', playerId);

    // Get player details from MongoDB
    const player = await Player.findOne({ playerId });

    if (!player) {
      return res.status(404).json({ 
        success: false,
        error: 'Player data not found in database'
      });
    }

    // Get surrounding players (5 above and 5 below)
    const start = Math.max(0, rank - 5);
    const end = rank + 5;
    const surrounding = await redisClient.zRangeWithScores('leaderboard', start, end, { REV: true });

    const surroundingPlayerIds = surrounding.map(p => p.value);
    const surroundingPlayers = await Player.find({ playerId: { $in: surroundingPlayerIds } });
    
    const playerMap = {};
    surroundingPlayers.forEach(p => {
      playerMap[p.playerId] = p;
    });

    const surroundingList = surrounding.map((item, index) => ({
      rank: start + index + 1,
      playerId: item.value,
      playerName: playerMap[item.value]?.playerName || 'Unknown',
      score: item.score,
      isCurrentPlayer: item.value === playerId
    }));

    res.json({
      success: true,
      player: {
        playerId: player.playerId,
        playerName: player.playerName,
        rank: rank + 1,
        score: score
      },
      surrounding: surroundingList
    });
  } catch (error) {
    console.error('Error fetching rank:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch player rank. Please try again later.'
    });
  }
};

module.exports = {
  updateScore,
  getLeaderboard,
  getPlayerRank
};