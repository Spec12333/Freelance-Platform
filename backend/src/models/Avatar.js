const { DataTypes } = require('sequelize');

// Keep binary images out of ordinary user/profile queries.
module.exports = (sequelize) => sequelize.define('Avatar', {
  userId: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  data: { type: DataTypes.BLOB, allowNull: false },
  version: { type: DataTypes.STRING(64), allowNull: false },
});
