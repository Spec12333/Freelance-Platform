const { ApiError } = require('../utils/ApiError');

// validate(schema, 'body' | 'query' | 'params')
//
// The validated result lands on req.valid, not back on req.body/req.query.
// Reason: in Express 5 req.query is exposed through a getter with no setter, so
// assigning to it throws. Keeping all three sources on req.valid is uniform and
// has a useful side effect - a controller reading req.valid.body can only ever
// see data that passed a schema.
const validate = (schema, source = 'body') => (req, res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false, // report every bad field at once, not just the first
    stripUnknown: true, // silently drop fields the schema does not declare
    convert: true, // query strings arrive as text: "5" becomes 5, "true" becomes true
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }

  req.valid = { ...req.valid, [source]: value };
  next();
};

module.exports = { validate };
