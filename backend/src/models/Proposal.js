const { DataTypes } = require('sequelize');
const { PROPOSAL_STATUS, PROPOSAL_STATUS_VALUES } = require('../config/constants');

module.exports = (sequelize) =>
  sequelize.define(
    'Proposal',
    {
      price: { type: DataTypes.INTEGER, allowNull: false },
      coverLetter: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM(...PROPOSAL_STATUS_VALUES),
        allowNull: false,
        defaultValue: PROPOSAL_STATUS.PENDING,
      },
      // The notification feature from the spec: the dashboard counts proposals
      // with viewedByClient = false, and opening the proposal list clears them.
      viewedByClient: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      indexes: [
        // "One proposal per order" enforced by the database, not only by service
        // code. Two simultaneous requests cannot both pass a service-level check,
        // but they cannot both satisfy this index.
        { unique: true, fields: ['orderId', 'freelancerId'] },
      ],
    },
  );
