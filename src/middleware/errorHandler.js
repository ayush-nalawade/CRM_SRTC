const logger = require('../config/logger');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.status || err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || undefined;

  // Normalize Zod validation errors to 400
  if ((err.name === 'ZodError') || (Array.isArray(err.issues) && err.issues.length)) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.issues || details;
  }

  if (statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, message);
  } else {
    logger.warn({ err, path: req.path, method: req.method }, message);
  }

  res.status(statusCode).json({ success: false, code, message, details });
}

module.exports = errorHandler;


