const { body, param, validationResult } = require('express-validator');

/**
 * Validation middleware to handle validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Validate refresh token request
 */
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),
  validate
];

/**
 * Validate Google auth callback code
 */
const validateGoogleCallback = [
  body('code')
    .optional()
    .isString()
    .withMessage('Authorization code must be a string'),
  body('error')
    .optional()
    .isString(),
  validate
];

/**
 * Validate user ID parameter
 */
const validateUserId = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  validate
];

/**
 * Validate user profile update
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  validate
];

/**
 * Validate email parameter
 */
const validateEmail = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  validate
];

/**
 * Sanitize and validate query parameters
 */
const validateQueryParams = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  validate
];

module.exports = {
  validate,
  validateRefreshToken,
  validateGoogleCallback,
  validateUserId,
  validateProfileUpdate,
  validateEmail,
  validateQueryParams
};