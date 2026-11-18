const Joi = require('joi');
const { PROPOSAL_STATUS_VALUES } = require('../config/constants');
const { paginationQuery } = require('./common');

const proposalFields = {
  price: Joi.number().integer().min(1).max(1_000_000),
  coverLetter: Joi.string().trim().min(5).max(3000),
};

const createProposalSchema = Joi.object({
  price: proposalFields.price.required(),
  coverLetter: proposalFields.coverLetter.required(),
});

// PATCH accepts either editable field, but never an empty body.
const updateProposalSchema = Joi.object(proposalFields).min(1);

// GET /proposals/my - a freelancer's own proposals. orderId answers "have I
// already applied to this order?" for the order page.
const myProposalsQuery = Joi.object({
  ...paginationQuery,
  status: Joi.string().valid(...PROPOSAL_STATUS_VALUES),
  orderId: Joi.number().integer().positive(),
});

module.exports = { createProposalSchema, updateProposalSchema, myProposalsQuery };
