/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns a consistent JSON response.
 * In production, 500 errors show a generic message to avoid leaking internals.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
