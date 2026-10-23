const Joi = require('joi');

// targetId is deliberately not accepted: the server derives it from the order,
// so nobody can post a review about an arbitrary user.
const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(500).allow('', null),
});

module.exports = { createReviewSchema };
