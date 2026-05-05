/**
 * ============================================================================
 * GLOBAL ERROR HANDLER MIDDLEWARE
 * ============================================================================
 * 
 * Centralized error handling for all routes and controllers.
 * Provides consistent error response format across the entire API.
 * 
 * Error Response Format:
 * {
 *   success: false,
 *   message: "Error description"
 * }
 */

/**
 * Global Error Handler
 * 
 * Catches all errors thrown from routes and controllers.
 * Must be defined AFTER all other middleware and routes.
 * 
 * Features:
 * - Logs error details to console
 * - Returns appropriate HTTP status codes
 * - Hides sensitive error details in production
 * - Provides user-friendly error messages
 * 
 * Error Details:
 * - err.statusCode: Custom HTTP status (default: 500)
 * - err.message: Human-readable error description
 * - Production: Hides error details for 5xx errors
 * - Development: Shows full error message for debugging
 * 
 * @param {Error} err - Error object with optional statusCode property
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function (unused)
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  // Log error details to console for debugging
  console.error(`[ERROR] ${err.message}`, err.stack);

  // Determine HTTP status code
  const statusCode = err.statusCode || 500;

  // Determine error message
  // In production, hide internal error details for 500 errors
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  // Return error response
  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
