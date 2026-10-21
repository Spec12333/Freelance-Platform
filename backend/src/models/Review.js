const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Review',
    {
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      comment: { type: DataTypes.TEXT, validate: { len: [0, 500] } },
      // authorId and targetId both point at User: both sides of an order review
      // each other, so a rating needs to know who it is about. Without targetId
      // a freelancer's rating cannot be computed at all.
    },
    {
      indexes: [
        // One review per author per order.
        { unique: true, fields: ['orderId', 'authorId'] },
      ],
    },
  );
