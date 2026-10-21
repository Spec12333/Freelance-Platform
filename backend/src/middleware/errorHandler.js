const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } = require('sequelize');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

// The last middleware in app.js. Every error ends here, so the response shape is
// always { message } (plus details for validation errors) - the frontend never
// has to guess how an error looks.
// The unused "next" parameter is required: Express only recognizes a middleware
// as an error handler when it declares four parameters.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Expected errors thrown on purpose by services and middleware.
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // A unique index was hit without the service translating it first. Services
  // catch the cases they know (second proposal, second review) and give a better
  // message; this is the safety net that keeps it a 409 instead of a 500.
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({ message: 'This record already exists' });
  }

  // Model-level validation (isEmail, min/max on rating, allowNull) that was not
  // caught by a Joi schema earlier.
  if (err instanceof ValidationError) {
    return res.status(400).json({
      message: 'Validation failed',
      details: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // A foreign key pointing at something that does not exist, e.g. categoryId: 999.
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ message: 'Referenced record does not exist' });
  }

  // Anything left is a bug. Log it in full on the server, tell the client
  // nothing about internals, and show the stack only outside production.
  console.error('Unhandled error:', err);
  return res.status(500).json({
    message: 'Internal server error',
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = { errorHandler };
