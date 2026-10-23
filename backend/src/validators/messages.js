const Joi = require('joi');

const createMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(2000).required(),
});

module.exports = { createMessageSchema };
