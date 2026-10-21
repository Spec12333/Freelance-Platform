// Errors the application expects and wants to turn into a meaningful HTTP
// status. Anything thrown that is NOT an ApiError is treated as a bug by
// errorHandler and becomes a 500 with no internal details leaked.
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    // Only validation errors carry details (the per-field list from Joi).
    this.details = details;
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You are not allowed to do this') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }

  // Used for rule conflicts: a second proposal on the same order, a second
  // review by the same author, an order that is no longer in the right status.
  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }
}

module.exports = { ApiError };
