const { UniqueConstraintError } = require('sequelize');
const { Order, Review, User } = require('../models');
const { ORDER_STATUS } = require('../config/constants');
const { ApiError } = require('../utils/ApiError');
const { getPagination, buildPage } = require('../utils/pagination');
const { USER_REF_ATTRIBUTES } = require('./query.helpers');
const { participantRole } = require('./orders.service');

const reviewInclude = [{ model: User, as: 'author', attributes: USER_REF_ATTRIBUTES }];

// POST /orders/:id/review
const create = async (user, orderId, { rating, comment }) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const role = participantRole(order, user.id);
  if (!role) throw ApiError.forbidden('Only the participants of this order can review it');

  if (order.status !== ORDER_STATUS.COMPLETED) {
    throw ApiError.conflict(`Reviews can be left only on COMPLETED orders (current status: ${order.status})`);
  }

  // The target is always "the other side" of the order, worked out here and
  // never taken from the request.
  const targetId = role === 'client' ? order.freelancerId : order.clientId;

  try {
    const review = await Review.create({
      orderId,
      authorId: user.id,
      targetId,
      rating,
      comment: comment || null,
    });
    return Review.findByPk(review.id, { include: reviewInclude });
  } catch (error) {
    // Same idea as proposals: the (orderId, authorId) unique index decides.
    if (error instanceof UniqueConstraintError) {
      throw ApiError.conflict('You have already reviewed this order');
    }
    throw error;
  }
};

// GET /orders/:id/reviews - at most two: one from each side.
const listByOrder = async (orderId) => {
  const order = await Order.findByPk(orderId, { attributes: ['id'] });
  if (!order) throw ApiError.notFound('Order not found');
  return Review.findAll({ where: { orderId }, include: reviewInclude, order: [['createdAt', 'ASC']] });
};

// GET /freelancers/:id/reviews - reviews about a user, newest first.
const listByUser = async (userId, query) => {
  const target = await User.findByPk(userId, { attributes: ['id'] });
  if (!target) throw ApiError.notFound('User not found');

  const pagination = getPagination(query);
  const result = await Review.findAndCountAll({
    where: { targetId: userId },
    include: reviewInclude,
    order: [['createdAt', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return buildPage(result, pagination);
};

// Latest few, for the profile page.
const latestForUser = (userId, limit = 5) =>
  Review.findAll({ where: { targetId: userId }, include: reviewInclude, order: [['createdAt', 'DESC']], limit });

module.exports = { create, listByOrder, listByUser, latestForUser };
