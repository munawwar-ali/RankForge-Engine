const Joi = require('joi');

// Validation schemas
const scoreSchema = Joi.object({
  playerId: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'playerId must only contain alphanumeric characters',
      'string.min': 'playerId must be at least 3 characters long',
      'string.max': 'playerId cannot exceed 30 characters',
      'any.required': 'playerId is required'
    }),
  playerName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'playerName must be at least 2 characters long',
      'string.max': 'playerName cannot exceed 50 characters',
      'any.required': 'playerName is required'
    }),
  score: Joi.number()
    .integer()
    .min(0)
    .max(999999999)
    .required()
    .messages({
      'number.base': 'score must be a number',
      'number.integer': 'score must be an integer',
      'number.min': 'score cannot be negative',
      'number.max': 'score is too large',
      'any.required': 'score is required'
    })
});

const playerIdSchema = Joi.object({
  playerId: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
});

// Validation middleware
const validateScore = (req, res, next) => {
  const { error } = scoreSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details[0].message
    });
  }
  
  next();
};

const validatePlayerId = (req, res, next) => {
  const { error } = playerIdSchema.validate(req.params);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details[0].message
    });
  }
  
  next();
};

module.exports = {
  validateScore,
  validatePlayerId
};