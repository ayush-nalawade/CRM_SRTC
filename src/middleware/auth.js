const createError = require('http-errors');
const { verifyToken } = require('../utils/jwt');

function verifyJWT(req, res, next) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return next(createError(401, 'Missing or invalid Authorization header', { code: 'UNAUTHORIZED' }));
  }
  const token = header.substring('Bearer '.length);
  try {
    const payload = verifyToken(token);
    req.auth = { userId: payload.sub, orgId: payload.org, role: payload.role, token };
    return next();
  } catch (err) {
    return next(createError(401, 'Invalid or expired token', { code: 'UNAUTHORIZED' }));
  }
}

module.exports = { verifyJWT };


