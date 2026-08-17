// 404 handler — anything that doesn't match a defined route lands here.
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
};

/**
 * Centralized error handler.
 * IMPORTANT: in production we never send back raw error messages/stack
 * traces to the client — that can leak internal details (DB structure,
 * file paths, library versions) that help an attacker. We log the full
 * error server-side and send a generic message to the client instead.
 */
const errorHandler = (err, req, res, next) => {
  console.error(err); // full detail goes to server logs, not the response

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = "Something went wrong. Please try again.";

  // Known, safe-to-expose Mongoose errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already in use`;
  } else if (process.env.NODE_ENV !== "production") {
    // In development, show the real message to speed up debugging
    message = err.message;
  }

  res.status(statusCode).json({ message });
};

module.exports = { notFound, errorHandler };
