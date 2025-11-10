const { verifyAccessToken } = require('../configs/jwt.config');
const { ApiError } = require('./api.error');
const rateLimit = require('express-rate-limit');

/**
 * Authentication middleware - reads token from cookies or Authorization header
 */
const authenticate = (req, res, next) => {
  try {
    let token;

    // ✅ FIRST: Try to get token from cookies
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // ✅ SECOND: Try to get token from Authorization header (Bearer token)
    else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    // If no token found, throw error
    if (!token) {
      throw new ApiError(401, 'No token provided. Authentication required.');
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired token. Please login again.');
    }

    // Attach user ID to request
    req.userId = decoded.id;
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiting for authentication endpoints
 */
const rateLimitAuth = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health check
      return req.path === '/health';
    }
  });
};

module.exports = {
  authenticate,
  rateLimitAuth
};