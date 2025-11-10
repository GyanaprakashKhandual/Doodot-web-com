const express = require('express');
const router = express.Router();
const {
  initiateGoogleLogin,
  handleGoogleCallback,
  refreshAccessToken,
  logout,
  getCurrentUser,
  updateUserProfile,
  deleteUserAccount
} = require('../controllers/user.controller');
const { authenticate, rateLimitAuth } = require('../middlewares/auth.middleware');
const {
  validateRefreshToken,
  validateProfileUpdate
} = require('../middlewares/user.validator');

// ============ Authentication Routes ============

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get('/auth/google', rateLimitAuth(), initiateGoogleLogin);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth redirect (from Google)
 * @access  Public
 */
router.get('/auth/google/callback', handleGoogleCallback);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/auth/refresh', validateRefreshToken, refreshAccessToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/auth/logout', authenticate, logout);

// ============ User Profile Routes ============

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/users/me', authenticate, getCurrentUser);

/**
 * @route   PATCH /api/users/me
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/users/me', authenticate, validateProfileUpdate, updateUserProfile);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
router.delete('/users/me', authenticate, deleteUserAccount);

module.exports = router;