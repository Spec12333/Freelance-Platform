const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { User } = require('../models');
const { ApiError } = require('../utils/ApiError');

// 10 rounds is the usual balance: slow enough to make brute force expensive,
// fast enough (~100ms) not to be felt on login.
const SALT_ROUNDS = 10;

// Only id and role go into the token. Anything else (name, email, isBlocked)
// could go stale, and the auth middleware loads the fresh user anyway.
const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const register = async ({ email, password, name, role }) => {
  // The unique index would also stop this, but checking first lets us answer
  // with a message about the email instead of a generic conflict.
  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('This email is already registered');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash, name, role });

  // user is serialized through User.prototype.toJSON, so no hash reaches the client.
  return { token: signToken(user), user };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });

  // Same message for an unknown email and a wrong password. A different one
  // would turn this endpoint into a tool for discovering registered emails.
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) throw ApiError.unauthorized('Invalid email or password');

  // Checked after the password so a blocked user learns nothing by guessing.
  if (user.isBlocked) throw ApiError.forbidden('Your account has been blocked');

  return { token: signToken(user), user };
};

module.exports = { register, login };
