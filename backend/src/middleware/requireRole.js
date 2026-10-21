const { ApiError } = require('../utils/ApiError');

// Factory: requireRole('CLIENT') or requireRole('CLIENT', 'ADMIN').
// Always used after auth, which is what fills req.user.
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    // Reaching this means the route forgot the auth middleware - a bug in the
    // route definition rather than a client mistake.
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`This action requires role: ${roles.join(' or ')}`));
  }

  next();
};

module.exports = { requireRole };
