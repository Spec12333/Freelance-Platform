const { authenticateToken } = require('../services/session.service');
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

  // A JWT cannot be revoked once issued, so an admin blocking a user would have
  // no effect until the token expires. That is why the user is loaded and
  // checked on every request instead of trusting the payload alone.
  const { user } = await authenticateToken(token);

  req.user = { id: user.id, role: user.role };
  req.currentUser = user;
  next();
});

module.exports = { auth };
