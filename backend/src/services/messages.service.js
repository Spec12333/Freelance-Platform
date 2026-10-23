const { Order, Message, User } = require('../models');
const { ApiError } = require('../utils/ApiError');
const { getPagination, buildPage } = require('../utils/pagination');
const { USER_REF_ATTRIBUTES } = require('./query.helpers');
const { participantRole } = require('./orders.service');

const messageInclude = [{ model: User, as: 'sender', attributes: USER_REF_ATTRIBUTES }];

// The chat belongs to exactly two people: the order's client and the assigned
// freelancer. Everyone else - including freelancers whose proposals were
// rejected - gets a 403.
const loadOrderForChat = async (user, orderId) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (!participantRole(order, user.id)) {
    throw ApiError.forbidden('Only the client and the assigned freelancer can access this chat');
  }
  return order;
};

// Page 1 holds the most recent messages, and the items inside a page are in
// chronological order. A chat can render a page as it comes (newest at the
// bottom) and load page 2 for older history.
const list = async (user, orderId, query) => {
  await loadOrderForChat(user, orderId);
  const pagination = getPagination(query);

  const result = await Message.findAndCountAll({
    where: { orderId },
    include: messageInclude,
    // Newest first to pick the right page, then reversed below.
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  result.rows.reverse();
  return buildPage(result, pagination);
};

const create = async (user, orderId, { body }) => {
  const order = await loadOrderForChat(user, orderId);
  // Before a proposal is accepted there is nobody to talk to.
  if (!order.freelancerId) {
    throw ApiError.conflict('The chat opens once a freelancer is assigned to the order');
  }

  const message = await Message.create({ orderId, senderId: user.id, body });
  return Message.findByPk(message.id, { include: messageInclude });
};

module.exports = { list, create };
