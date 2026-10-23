const Joi = require('joi');
const { PROPOSAL_STATUS_VALUES } = require('../config/constants');
const { paginationQuery } = require('./common');

const createProposalSchema = Joi.object({
  price: Joi.number().integer().min(1).max(1_000_000).required(),
  coverLetter: Joi.string().trim().min(20).max(3000).required(),
});

// GET /proposals/my - a freelancer's own proposals. orderId answers "have I
// already applied to this order?" for the order page.
const myProposalsQuery = Joi.object({
  ...paginationQuery,
  status: Joi.string().valid(...PROPOSAL_STATUS_VALUES),
  orderId: Joi.number().integer().positive(),
});

module.exports = { createProposalSchema, myProposalsQuery };
