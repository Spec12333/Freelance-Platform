const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Message', {
    body: { type: DataTypes.TEXT, allowNull: false },
    // orderId and senderId come from the associations. Chat is always scoped to
    // one order, which is also what makes the access rule simple: only the order
    // client and the assigned freelancer may read or write.
  });
