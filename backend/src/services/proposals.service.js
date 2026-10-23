const { Op, UniqueConstraintError } = require('sequelize');
const { sequelize, Order, Proposal, User } = require('../models');
const { ORDER_STATUS, PROPOSAL_STATUS } = require('../config/constants');
const { ApiError } = require('../utils/ApiError');
const { getPagination, buildPage } = require('../utils/pagination');
const { userBadgeAttributes } = require('./query.helpers');
const ordersService = require('./orders.service');

const proposalInclude = [
  { model: User, as: 'freelancer', attributes: userBadgeAttributes('freelancer') },
];

const getById = (id) => Proposal.findByPk(id, { include: proposalInclude });

// GET /orders/:id/proposals - the order's client only.
const listByOrder = async (user, orderId) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.clientId !== user.id) {
    throw ApiError.forbidden('Only the author of the order can see its proposals');
  }

  // Read first, mark as viewed second: the response still carries the old
  // viewedByClient values, so the UI can highlight what is new on this visit.
  const proposals = await Proposal.findAll({
    where: { orderId },
    include: proposalInclude,
    order: [['createdAt', 'ASC']],
  });

  await Proposal.update({ viewedByClient: true }, { where: { orderId, viewedByClient: false } });

  return proposals;
};

// GET /proposals/my - a freelancer's own proposals with a short order summary.
const listMine = async (user, query) => {
  const pagination = getPagination(query);
  const where = { freelancerId: user.id };
  if (query.status) where.status = query.status;
  if (query.orderId) where.orderId = query.orderId;

  const result = await Proposal.findAndCountAll({
    where,
    include: [
      ...proposalInclude,
      { model: Order, as: 'order', attributes: ['id', 'title', 'status', 'budget', 'deadline'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return buildPage(result, pagination);
};

// POST /orders/:id/proposals - the role check (FREELANCER) is done by the route.
const create = async (user, orderId, { price, coverLetter }) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.clientId === user.id) throw ApiError.forbidden('You cannot send a proposal to your own order');
  if (order.status !== ORDER_STATUS.OPEN) {
    throw ApiError.conflict(`Proposals are accepted only while the order is OPEN (current status: ${order.status})`);
  }

  try {
    const proposal = await Proposal.create({ orderId, freelancerId: user.id, price, coverLetter });
    return getById(proposal.id);
  } catch (error) {
    // No "does one already exist?" query beforehand: two requests sent at the
    // same moment would both pass it. The composite unique index on
    // (orderId, freelancerId) is the real guard; this only rewords its error.
    if (error instanceof UniqueConstraintError) {
      throw ApiError.conflict('You have already sent a proposal for this order');
    }
    throw error;
  }
};

// POST /proposals/:id/accept - the client picks a freelancer.
//
// Three writes that must happen together or not at all:
//   1. the chosen proposal becomes ACCEPTED
//   2. every other pending proposal of the order becomes REJECTED
//   3. the order becomes IN_PROGRESS with freelancerId set
// If any step fails, the transaction rolls back and the order stays OPEN with
// all proposals PENDING - never half accepted.
const accept = async (user, proposalId) => {
  // Read without a lock just to learn which order this is (orderId never
  // changes, so this value cannot go stale).
  const found = await Proposal.findByPk(proposalId, { attributes: ['id', 'orderId'] });
  if (!found) throw ApiError.notFound('Proposal not found');

  const ids = await sequelize.transaction(async (transaction) => {
    // Lock the ORDER row first. Two clicks on two different proposals of the
    // same order both queue on this row: the second one waits, then reads the
    // order as IN_PROGRESS and gets a 409 instead of assigning a second
    // freelancer. Locking the order before any proposal also gives every
    // accept the same lock order, which rules out deadlocks.
    const order = await Order.findByPk(found.orderId, { transaction, lock: transaction.LOCK.UPDATE });
    if (order.clientId !== user.id) {
      throw ApiError.forbidden('Only the author of the order can accept a proposal');
    }
    if (order.status !== ORDER_STATUS.OPEN) {
      throw ApiError.conflict(`Order is no longer OPEN (current status: ${order.status})`);
    }

    // Re-read under the lock: its status may have changed since the first read.
    const proposal = await Proposal.findByPk(proposalId, { transaction, lock: transaction.LOCK.UPDATE });
    if (proposal.status !== PROPOSAL_STATUS.PENDING) {
      throw ApiError.conflict(`This proposal has already been processed (status: ${proposal.status})`);
    }

    await proposal.update({ status: PROPOSAL_STATUS.ACCEPTED }, { transaction });

    await Proposal.update(
      { status: PROPOSAL_STATUS.REJECTED },
      {
        where: { orderId: order.id, id: { [Op.ne]: proposal.id }, status: PROPOSAL_STATUS.PENDING },
        transaction,
      },
    );

    await order.update(
      { status: ORDER_STATUS.IN_PROGRESS, freelancerId: proposal.freelancerId },
      { transaction },
    );

    return { orderId: order.id, proposalId: proposal.id };
  });

  // Loaded after the commit, in the same shapes every other endpoint returns.
  return {
    order: await ordersService.getById(ids.orderId),
    proposal: await getById(ids.proposalId),
  };
};

module.exports = { listByOrder, listMine, create, accept };
