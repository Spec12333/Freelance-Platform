const Joi = require('joi');
const { ORDER_STATUS_VALUES } = require('../config/constants');
const { paginationQuery } = require('./common');

const MAX_MONEY = 1_000_000;

// Field rules shared by create and update. Create marks some of them required,
// update keeps all optional but demands at least one.
const orderFields = {
  title: Joi.string().trim().min(5).max(120),
  description: Joi.string().trim().min(20).max(5000),
  budget: Joi.number().integer().min(1).max(MAX_MONEY),
  // A deadline in the past makes no sense for a new or edited order. null
  // explicitly removes the deadline.
  deadline: Joi.date().iso().greater('now').allow(null),
  categoryId: Joi.number().integer().positive(),
};

const createOrderSchema = Joi.object({
  ...orderFields,
  title: orderFields.title.required(),
  description: orderFields.description.required(),
  budget: orderFields.budget.required(),
  categoryId: orderFields.categoryId.required(),
});

const updateOrderSchema = Joi.object(orderFields).min(1);

const listOrdersQuery = Joi.object({
  ...paginationQuery,
  categoryId: Joi.number().integer().positive(),
  status: Joi.string().valid(...ORDER_STATUS_VALUES),
  minBudget: Joi.number().integer().min(0),
  // Only compared with minBudget when both are present.
  maxBudget: Joi.number()
    .integer()
    .min(0)
    .when('minBudget', { is: Joi.exist(), then: Joi.number().min(Joi.ref('minBudget')) }),
  search: Joi.string().trim().max(100).allow(''),
  // "My orders" for a client and "my work" for a freelancer are this same list
  // filtered by a participant id.
  clientId: Joi.number().integer().positive(),
  freelancerId: Joi.number().integer().positive(),
});

// Which transitions are legal is decided by the service; Joi only rejects
// values that are not a status at all.
const changeStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...ORDER_STATUS_VALUES)
    .required(),
});

module.exports = { createOrderSchema, updateOrderSchema, listOrdersQuery, changeStatusSchema };
