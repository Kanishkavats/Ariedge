const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after express-validator chains; turns their errors into our ApiError shape.
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => e.msg);
    throw new ApiError(400, 'Validation failed', errors);
  }
  next();
};

module.exports = validate;
