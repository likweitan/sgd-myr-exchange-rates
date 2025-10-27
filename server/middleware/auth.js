const { API_BEARER_TOKEN } = require('../utils/config');

const authMiddleware = (req, res, next) => {
  if (!API_BEARER_TOKEN) {
    // If no token configured, allow all requests through.
    return next();
  }

  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();

  if (token && token === API_BEARER_TOKEN) {
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized',
  });
};

module.exports = authMiddleware;
