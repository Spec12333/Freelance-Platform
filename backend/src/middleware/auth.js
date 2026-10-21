const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { User } = require('../models');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

// Verifies the token and attaches the caller to the request.
// req.user        - the minimal { id, role } that most handlers need
// req.currentUser - the full instance, so /me and profile updates avoid a second query
const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authorization header must be "Bearer <token>"');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    // Covers a tampered signature, a wrong secret and an expired token alike -
    // the client can do nothing different in any of those cases.
    throw ApiError.unauthorized('Invalid or expired token');
  }

  // A JWT cannot be revoked once issued, so an admin blocking a user would have
  // no effect until the token expires. That is why the user is loaded and
  // checked on every request instead of trusting the payload alone.
  const user = await User.findByPk(payload.id);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.isBlocked) throw ApiError.forbidden('Your account has been blocked');

  req.user = { id: user.id, role: user.role };
  req.currentUser = user;
  next();
});

module.exports = { auth };
