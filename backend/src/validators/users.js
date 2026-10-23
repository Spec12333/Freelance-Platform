const Joi = require('joi');
const { paginationQuery } = require('./common');

// PATCH /freelancers/me. Every field is optional, at least one is required.
// null or an empty string clears a field.
const updateProfileSchema = Joi.object({
  bio: Joi.string().trim().max(1000).allow('', null),
  // Lowercased so the `skill` filter matches regardless of how it was typed.
  skills: Joi.array().items(Joi.string().trim().lowercase().min(1).max(30)).max(20).unique(),
  hourlyRate: Joi.number().integer().min(1).max(10_000).allow(null),
  portfolioUrl: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .max(255)
    .allow('', null),
  avatarUrl: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .max(255)
    .allow('', null),
}).min(1);

const listFreelancersQuery = Joi.object({
  ...paginationQuery,
  search: Joi.string().trim().max(100).allow(''),
  skill: Joi.string().trim().lowercase().max(30),
  minRate: Joi.number().integer().min(0),
  maxRate: Joi.number()
    .integer()
    .min(0)
    .when('minRate', { is: Joi.exist(), then: Joi.number().min(Joi.ref('minRate')) }),
  // rating: best first; rate: cheapest first.
  sort: Joi.string().valid('rating', 'rate').default('rating'),
});

module.exports = { updateProfileSchema, listFreelancersQuery };
