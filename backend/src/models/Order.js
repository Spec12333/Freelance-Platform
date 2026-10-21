const { DataTypes } = require('sequelize');
const { ORDER_STATUS, ORDER_STATUS_VALUES } = require('../config/constants');

module.exports = (sequelize) =>
  sequelize.define('Order', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    // Whole currency units. Integers avoid the rounding surprises of floats and
    // the string juggling of DECIMAL for a project at this scale.
    budget: { type: DataTypes.INTEGER, allowNull: false },
    deadline: { type: DataTypes.DATE },
    status: {
      type: DataTypes.ENUM(...ORDER_STATUS_VALUES),
      allowNull: false,
      defaultValue: ORDER_STATUS.OPEN,
    },
    // clientId, freelancerId and categoryId are added by the associations in
    // models/index.js, so they are not repeated here.
  });
