// Wraps an async route handler so a rejected promise reaches errorHandler via
// next(). Express 5 already does this on its own; the wrapper is kept so the
// error path is explicit in every controller and middleware, and so the code
// keeps working unchanged if it is ever run on Express 4, which does not.
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
