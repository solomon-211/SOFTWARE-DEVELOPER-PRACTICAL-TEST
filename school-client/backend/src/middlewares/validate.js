const { validationResult } = require('express-validator');

// Collect express-validator errors after route validation rules run.
// Returns 422 with a list of field-level messages so the client knows what to fix.
/**
 * Middleware: collect express-validator errors and return 422 if any exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
