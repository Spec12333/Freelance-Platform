const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Category', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    // Generated from the name; kept in the database so URLs stay stable even if
    // the display name is edited later.
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  });
