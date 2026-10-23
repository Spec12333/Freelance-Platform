const Joi = require('joi');
const { ROLE_VALUES } = require('../config/constants');
const { paginationQuery } = require('./common');

const adminUsersQuery = Joi.object({
  ...paginationQuery,
  role: Joi.string().valid(...ROLE_VALUES),
  search: Joi.string().trim().max(100).allow(''), // name or email
  isBlocked: Joi.boolean(),
});

const blockUserSchema = Joi.object({
  isBlocked: Joi.boolean().required(),
});

const categorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
});

module.exports = { adminUsersQuery, blockUserSchema, categorySchema };
