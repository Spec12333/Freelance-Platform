const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { User } = require('../models');
const { ApiError } = require('../utils/ApiError');

// HTTP and WebSocket connections use the same identity and account checks.
const authenticateToken = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
    if (!Number.isSafeInteger(payload.id) || payload.id <= 0) throw new Error('Invalid user id');
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findByPk(payload.id);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.isBlocked) throw ApiError.forbidden('Your account has been blocked');

  return { user, expiresAt: typeof payload.exp === 'number' ? payload.exp * 1000 : null };
};

module.exports = { authenticateToken };
