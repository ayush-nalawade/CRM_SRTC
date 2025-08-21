const logger = require('../config/logger');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || undefined;

  if (statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, message);
  } else {
    logger.warn({ err, path: req.path, method: req.method }, message);
  }

  res.status(statusCode).json({ success: false, code, message, details });
}

module.exports = errorHandler;


