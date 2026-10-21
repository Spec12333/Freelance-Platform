// The only place where the database connection and the relations between models
// live. Model files are factories, this file calls them and wires them together.
const { Sequelize } = require('sequelize');
const { env } = require('../config/env');

const UserModel = require('./User');
const CategoryModel = require('./Category');
const OrderModel = require('./Order');
const ProposalModel = require('./Proposal');
const ReviewModel = require('./Review');
const MessageModel = require('./Message');

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: false,
  // Managed Postgres (Neon, Render, Railway) requires TLS; a local server does
  // not support it. rejectUnauthorized stays false because those providers use
  // certificates that are not in the Node trust store.
  dialectOptions: env.isProduction
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
});

const User = UserModel(sequelize);
const Category = CategoryModel(sequelize);
const Order = OrderModel(sequelize);
const Proposal = ProposalModel(sequelize);
const Review = ReviewModel(sequelize);
const Message = MessageModel(sequelize);

// --- Associations ---------------------------------------------------------
// Four different belongsTo(User) relations exist, so every one of them needs an
// alias and every include must pass "as". They are kept side by side on purpose:
// this block is the map you read when writing a query.

// An order has two different users: the one who created it and the one doing it.
User.hasMany(Order, { as: 'createdOrders', foreignKey: 'clientId' });
Order.belongsTo(User, { as: 'client', foreignKey: 'clientId' });

User.hasMany(Order, { as: 'assignedOrders', foreignKey: 'freelancerId' });
// allowNull stays default (true): an order has no freelancer until a proposal
// is accepted.
Order.belongsTo(User, { as: 'freelancer', foreignKey: 'freelancerId' });

Category.hasMany(Order, { foreignKey: { name: 'categoryId', allowNull: false } });
Order.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });

Order.hasMany(Proposal, { as: 'proposals', foreignKey: { name: 'orderId', allowNull: false } });
Proposal.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });
User.hasMany(Proposal, { as: 'proposals', foreignKey: { name: 'freelancerId', allowNull: false } });
Proposal.belongsTo(User, { as: 'freelancer', foreignKey: 'freelancerId' });

Order.hasMany(Review, { as: 'reviews', foreignKey: { name: 'orderId', allowNull: false } });
Review.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });
// Who wrote it and who it is about - this pair is what makes ratings possible.
Review.belongsTo(User, { as: 'author', foreignKey: { name: 'authorId', allowNull: false } });
Review.belongsTo(User, { as: 'target', foreignKey: { name: 'targetId', allowNull: false } });
User.hasMany(Review, { as: 'writtenReviews', foreignKey: 'authorId' });
User.hasMany(Review, { as: 'receivedReviews', foreignKey: 'targetId' });

Order.hasMany(Message, { as: 'messages', foreignKey: { name: 'orderId', allowNull: false } });
Message.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });
Message.belongsTo(User, { as: 'sender', foreignKey: { name: 'senderId', allowNull: false } });

module.exports = { sequelize, User, Category, Order, Proposal, Review, Message };
