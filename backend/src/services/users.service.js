const { User } = require('../models');
const { ApiError } = require('../utils/ApiError');
const { publicUserAttributes, privateUserAttributes } = require('./query.helpers');

// Loads a user in the "CurrentUser" shape: the owner's own view, with email and
// the computed rating. Used by register, login, /auth/me and profile updates.
const getCurrentUser = async (id) => {
  const user = await User.findByPk(id, { attributes: privateUserAttributes() });
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

// The same user as anyone else sees them: no email.
const getPublicUser = async (id) => {
  const user = await User.findByPk(id, { attributes: publicUserAttributes() });
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

module.exports = { getCurrentUser, getPublicUser };
