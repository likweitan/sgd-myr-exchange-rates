const { CORS_ALLOWED_ORIGINS } = require('../utils/config');

const DEFAULT_ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'X-Requested-With',
  'Accept',
];

const corsMiddleware = (req, res, next) => {
  const requestOrigin = req.headers.origin;

  res.header('Vary', 'Origin');

  if (!CORS_ALLOWED_ORIGINS.length || CORS_ALLOWED_ORIGINS.includes('*')) {
    res.header('Access-Control-Allow-Origin', requestOrigin || '*');
  } else if (requestOrigin && CORS_ALLOWED_ORIGINS.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', DEFAULT_ALLOWED_HEADERS.join(', '));
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
};

module.exports = corsMiddleware;
