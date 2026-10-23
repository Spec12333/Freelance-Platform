const { Op, literal } = require('sequelize');
const { sequelize, Order, Proposal, Category, User } = require('../models');
const { ORDER_STATUS, PROPOSAL_STATUS } = require('../config/constants');
const { ApiError } = require('../utils/ApiError');
const { getPagination, buildPage } = require('../utils/pagination');
const { userSummaryAttributes } = require('./query.helpers');

const { OPEN, IN_PROGRESS, REVIEW, COMPLETED, CANCELLED } = ORDER_STATUS;

// --- Status machine --------------------------------------------------------
// Every legal status change and the participant allowed to make it. Anything
// that is not in this map is refused, so adding a transition means adding one
// line here rather than another branch in an if-chain.
//
// OPEN -> IN_PROGRESS is deliberately absent. An order can only start through
// acceptProposal, which assigns the freelancer in the same transaction - a bare
// status change would produce an IN_PROGRESS order with nobody working on it.
const TRANSITIONS = {
  [OPEN]: { [CANCELLED]: 'client' },
  [IN_PROGRESS]: { [REVIEW]: 'freelancer', [CANCELLED]: 'client' },
  [REVIEW]: { [COMPLETED]: 'client' },
  [COMPLETED]: {},
  [CANCELLED]: {},
};

// --- Shared query shape ----------------------------------------------------
// Every endpoint that returns an order (list, detail, create, update, status
// change, accept, dashboard) uses this, so the frontend gets one Order shape.
const orderQueryOptions = () => ({
  attributes: {
    include: [
      [
        literal('(SELECT COUNT(*)::int FROM "Proposals" AS p WHERE p."orderId" = "Order"."id")'),
        'proposalsCount',
      ],
    ],
  },
  include: [
    { model: User, as: 'client', attributes: userSummaryAttributes('client') },
    { model: User, as: 'freelancer', attributes: userSummaryAttributes('freelancer') },
    { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
  ],
});

const getById = async (id) => {
  const order = await Order.findByPk(id, orderQueryOptions());
  if (!order) throw ApiError.notFound('Order not found');
  return order;
};

const list = async (query) => {
  const { categoryId, status, minBudget, maxBudget, search, clientId, freelancerId } = query;
  const pagination = getPagination(query);

  // Each filter is added only when present, so an empty query lists everything.
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (freelancerId) where.freelancerId = freelancerId;
  if (search) where.title = { [Op.iLike]: `%${search}%` };
  if (minBudget !== undefined || maxBudget !== undefined) {
    where.budget = {};
    if (minBudget !== undefined) where.budget[Op.gte] = minBudget;
    if (maxBudget !== undefined) where.budget[Op.lte] = maxBudget;
  }

  const result = await Order.findAndCountAll({
    ...orderQueryOptions(),
    where,
    order: [['createdAt', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return buildPage(result, pagination);
};

const ensureCategoryExists = async (categoryId) => {
  // Checked explicitly so a bad id gets a message about the category instead of
  // the generic foreign-key error.
  const category = await Category.findByPk(categoryId);
  if (!category) throw ApiError.badRequest('Category does not exist');
};

const create = async (clientId, data) => {
  await ensureCategoryExists(data.categoryId);
  const order = await Order.create({ ...data, clientId, status: OPEN });
  return getById(order.id);
};

const update = async (user, orderId, data) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.clientId !== user.id) throw ApiError.forbidden('Only the author can edit this order');
  // Once a freelancer is working on it, the terms they agreed to are frozen.
  if (order.status !== OPEN) {
    throw ApiError.conflict(`Order can only be edited while it is OPEN (current status: ${order.status})`);
  }
  if (data.categoryId) await ensureCategoryExists(data.categoryId);

  await order.update(data);
  return getById(order.id);
};

// Which side of the order the user is on, or null for an outsider.
const participantRole = (order, userId) => {
  if (order.clientId === userId) return 'client';
  if (order.freelancerId !== null && order.freelancerId === userId) return 'freelancer';
  return null;
};

const changeStatus = async (user, orderId, nextStatus) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const role = participantRole(order, user.id);
  if (!role) throw ApiError.forbidden('Only the participants of this order can change its status');

  const allowedRole = TRANSITIONS[order.status][nextStatus];

  // Not a legal move from the current status at all -> 409, naming the status
  // so the UI can show why.
  if (!allowedRole) {
    if (order.status === OPEN && nextStatus === IN_PROGRESS) {
      throw ApiError.conflict('An order moves to IN_PROGRESS only when a proposal is accepted');
    }
    throw ApiError.conflict(`Cannot change status from ${order.status} to ${nextStatus}`);
  }

  // A legal move, but made by the wrong side -> 403.
  if (allowedRole !== role) {
    throw ApiError.forbidden(`Only the order ${allowedRole} can move it to ${nextStatus}`);
  }

  await sequelize.transaction(async (transaction) => {
    await order.update({ status: nextStatus }, { transaction });

    // Cancelling an OPEN order closes the pending proposals with it, otherwise
    // they would sit in freelancers' lists and in the client's unseen counter.
    if (nextStatus === CANCELLED) {
      await Proposal.update(
        { status: PROPOSAL_STATUS.REJECTED },
        { where: { orderId: order.id, status: PROPOSAL_STATUS.PENDING }, transaction },
      );
    }
  });

  return getById(order.id);
};

module.exports = {
  TRANSITIONS,
  orderQueryOptions,
  participantRole,
  getById,
  list,
  create,
  update,
  changeStatus,
};
