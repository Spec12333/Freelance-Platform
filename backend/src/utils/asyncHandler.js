// Wraps an async route handler so a rejected promise reaches errorHandler via
// next(). Without it every controller would need its own try/catch, and one
// forgotten catch would hang the request instead of answering with an error.
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
