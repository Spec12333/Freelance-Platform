const Joi = require('joi');
const { DEFAULT_LIMIT, MAX_LIMIT } = require('../utils/pagination');

// Reusable pieces so every list endpoint paginates the same way and every
// ":id" route rejects "abc" before any query runs.

const idParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// Spread into a list query schema: { ...paginationQuery, status: ... }
const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  // Capped so a client cannot ask for 100000 rows in one request.
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
};

module.exports = { idParam, paginationQuery };
