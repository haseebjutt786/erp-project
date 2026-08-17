// Wraps an async controller so any thrown/rejected error is passed to
// next(error) automatically, instead of every controller needing its own
// try/catch. This ensures ALL errors flow through the centralized
// errorHandler middleware (middleware/errorMiddleware.js), which is what
// keeps raw error details from leaking to the client in production.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
