const { fn, col, Op } = require('sequelize');
const { Order, Proposal, User, Category } = require('../models');
const { ROLES, ORDER_STATUS, ORDER_STATUS_VALUES, PROPOSAL_STATUS, PROPOSAL_STATUS_VALUES, ROLE_VALUES } =
  require('../config/constants');
const { orderQueryOptions } = require('./orders.service');
const usersService = require('./users.service');

// GROUP BY returns only the values that exist. This fills in zeros for the
// rest, so the frontend always gets every key and never has to check for one.
const countBy = async (Model, column, values, where = {}) => {
  const rows = await Model.findAll({
    where,
    attributes: [column, [fn('COUNT', col('id')), 'count']],
    group: [column],
    raw: true,
  });
  const counts = Object.fromEntries(values.map((value) => [value, 0]));
  for (const row of rows) counts[row[column]] = Number(row.count);
  return counts;
};

const forClient = async (user) => ({
  role: ROLES.CLIENT,
  orders: await countBy(Order, 'status', ORDER_STATUS_VALUES, { clientId: user.id }),
  recentOrders: await Order.findAll({
    ...orderQueryOptions(),
    where: { clientId: user.id },
    order: [['createdAt', 'DESC']],
    limit: 5,
  }),
  // The notification counter: pending proposals on my orders that I have not
  // opened yet. It drops to 0 as soon as the proposal list of an order is
  // opened, because that request marks them as viewed.
  unseenProposals: await Proposal.count({
    where: { viewedByClient: false, status: PROPOSAL_STATUS.PENDING },
    include: [{ model: Order, as: 'order', where: { clientId: user.id }, attributes: [] }],
  }),
});

const forFreelancer = async (user) => {
  const me = await usersService.getCurrentUser(user.id);
  return {
    role: ROLES.FREELANCER,
    proposals: await countBy(Proposal, 'status', PROPOSAL_STATUS_VALUES, { freelancerId: user.id }),
    // The work on my plate right now: orders I am doing or waiting to be approved.
    activeOrders: await Order.findAll({
      ...orderQueryOptions(),
      where: {
        freelancerId: user.id,
        status: { [Op.in]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.REVIEW] },
      },
      order: [['updatedAt', 'DESC']],
    }),
    rating: me.get('rating'),
    reviewsCount: me.get('reviewsCount'),
  };
};

const forAdmin = async () => ({
  role: ROLES.ADMIN,
  users: await countBy(User, 'role', ROLE_VALUES),
  blockedUsers: await User.count({ where: { isBlocked: true } }),
  orders: await countBy(Order, 'status', ORDER_STATUS_VALUES),
  categories: await Category.count(),
});

const HANDLERS = {
  [ROLES.CLIENT]: forClient,
  [ROLES.FREELANCER]: forFreelancer,
  [ROLES.ADMIN]: forAdmin,
};

const get = (user) => HANDLERS[user.role](user);

module.exports = { get };
