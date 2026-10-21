const { DataTypes } = require('sequelize');
const { ROLE_VALUES } = require('../config/constants');

// Factory style: this file knows nothing about the sequelize instance or its
// sibling models, so models/index.js stays the single place that wires things
// together and circular requires are impossible by construction.
module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM(...ROLE_VALUES), allowNull: false },

    // Freelancer profile fields. They stay on User instead of a separate table
    // because a freelancer is a user with extra fields, not a different entity.
    bio: { type: DataTypes.TEXT },
    skills: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    hourlyRate: { type: DataTypes.INTEGER },
    portfolioUrl: { type: DataTypes.STRING },
    avatarUrl: { type: DataTypes.STRING },

    isBlocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  });

  // Single choke point for hiding the hash. Every res.json() of a user - alone,
  // nested inside an order, or in an array - goes through toJSON, so the hash
  // cannot leak by forgetting an "attributes: { exclude }" in one query.
  // The instance itself still has passwordHash, which is what login compares.
  User.prototype.toJSON = function toJSON() {
    const { passwordHash, ...safe } = this.get({ plain: true });
    return safe;
  };

  return User;
};
