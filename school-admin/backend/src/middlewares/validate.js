/**
 * ============================================================================
 * VALIDATION MIDDLEWARE
 * ============================================================================
 * 
 * Middleware for handling validation errors from express-validator.
 * Should be placed after validation rules in route definitions.
 * 
 * Usage:
 * router.post('/route',
 *   body('email').isEmail(),
 *   body('password').isLength({ min: 8 }),
 *   validate,  // <-- This middleware
 *   controller
 * );
 */

const { validationResult } = require('express-validator');

/**
 * Validation Error Handler
 * 
 * Checks for validation errors collected by express-validator.
 * Returns detailed validation errors in response.
 * 
 * Response Format (on error):
 * {
 *   success: false,
 *   message: "Validation failed",
 *   errors: [
 *     { field: "email", message: "Valid email is required" },
 *     { field: "password", message: "Password must be at least 8 characters" }
 *   ]
 * }
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const validate = (req, res, next) => {
  // Collect validation errors from the request
  const errors = validationResult(req);

  // If validation errors exist, return 422 Unprocessable Entity
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      // Transform error array into user-friendly format
      errors: errors.array().map((e) => ({ 
        field: e.path,      // Field name that failed
        message: e.msg      // Validation error message
      })),
    });
  }

  // No validation errors, proceed to next middleware/controller
  next();
};

module.exports = validate;
