const createError = require('http-errors');

function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    const auth = req.auth;
    if (!auth || !auth.role) {
      return next(createError(401, 'Unauthorized', { code: 'UNAUTHORIZED' }));
    }
    if (!allowedRoles.includes(auth.role)) {
      return next(createError(403, 'Forbidden', { code: 'FORBIDDEN' }));
    }
    return next();
  };
}

module.exports = { requireRole };


