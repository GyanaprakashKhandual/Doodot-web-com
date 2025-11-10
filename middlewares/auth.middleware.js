const { verifyAccessToken } = require('../configs/jwt.config');
const User = require('../models/user.model');
const { ApiError } = require('../middlewares/api.error');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided. Authentication required.');
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      throw new ApiError(401, 'Invalid token format');
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token has expired. Please refresh your token.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token. Authentication failed.');
      }
      throw new ApiError(401, 'Token verification failed');
    }

    // Find user
    const user = await User.findById(decoded.id).select('-refreshTokens');
    
    if (!user) {
      throw new ApiError(401, 'User not found. Token is invalid.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated. Please contact support.');
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-refreshTokens');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.token = token;
      }
    } catch (error) {
      // Silently fail for optional auth
      console.log('Optional auth failed:', error.message);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has specific permissions
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};

/**
 * Rate limiting middleware for authentication attempts
 */
const loginAttempts = new Map();

const rateLimitAuth = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!loginAttempts.has(identifier)) {
      loginAttempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const attempts = loginAttempts.get(identifier);
    
    if (now > attempts.resetTime) {
      loginAttempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (attempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((attempts.resetTime - now) / 1000 / 60);
      return next(new ApiError(429, `Too many authentication attempts. Please try again in ${timeLeft} minutes.`));
    }

    attempts.count++;
    loginAttempts.set(identifier, attempts);
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  rateLimitAuth
};