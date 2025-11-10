const User = require('../models/user.model');
const { generateTokens, verifyRefreshToken } = require('../configs/jwt.config');
const { getGoogleAuthURL, getGoogleTokensAndUser } = require('../configs/passport.config');
const { ApiError } = require('../middlewares/api.error');
const { ApiResponse } = require('../utils/api.response');
const { sendWelcomeEmail } = require('../services/email.service');

/**
 * Initiate Google OAuth login
 * @route GET /api/auth/google
 */
const initiateGoogleLogin = async (req, res, next) => {
  try {
    const authUrl = getGoogleAuthURL();
    
    res.json(new ApiResponse(
      200,
      { authUrl },
      'Google OAuth URL generated successfully'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Google OAuth callback - UPDATED VERSION
 * @route GET /api/auth/google/callback
 */
const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    // Handle Google errors
    if (error) {
      return res.redirect(
        `http://localhost:3000/?error=${encodeURIComponent(error)}`
      );
    }

    // Check if code exists
    if (!code) {
      return res.redirect(
        `http://localhost:3000/?error=${encodeURIComponent('No authorization code provided')}`
      );
    }

    // Get tokens and user info from Google
    const { userInfo } = await getGoogleTokensAndUser(code);

    if (!userInfo || !userInfo.sub || !userInfo.email) {
      return res.redirect(
        `http://localhost:3000/?error=${encodeURIComponent('Failed to retrieve user information from Google')}`
      );
    }

    // Check if user exists
    let user = await User.findByGoogleId(userInfo.sub);

    if (!user) {
      // Create new user
      user = await User.create({
        googleId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name || userInfo.email.split('@')[0],
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        profilePicture: userInfo.picture || null,
        isEmailVerified: userInfo.email_verified || true
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    } else {
      // Update last login
      await user.updateLastLogin();
      
      // Update profile picture if changed
      if (userInfo.picture && user.profilePicture !== userInfo.picture) {
        user.profilePicture = userInfo.picture;
        await user.save();
      }
    }

    // Generate JWT tokens
    const tokens = generateTokens(user);

    // Save refresh token to user
    await user.addRefreshToken(tokens.refreshToken);

    // ✅ SET TOKENS IN HTTP-ONLY COOKIES
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // ✅ REDIRECT DIRECTLY TO /app (NOT /auth/callback)
    return res.redirect('http://localhost:3000/app');

  } catch (error) {
    console.error('Google callback error:', error);
    return res.redirect(
      `http://localhost:3000/?error=${encodeURIComponent('Authentication failed')}`
    );
  }
};

/**
 * Refresh access token using refresh token
 * @route POST /api/auth/refresh
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    // Check if refresh token is in user's token list
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    
    if (!tokenExists) {
      throw new ApiError(401, 'Refresh token not found or has been revoked');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(tokens.refreshToken);

    res.json(new ApiResponse(
      200,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      },
      'Token refreshed successfully'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken && user) {
      // Remove refresh token
      await user.removeRefreshToken(refreshToken);
    }

    // ✅ CLEAR COOKIES ON LOGOUT
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/users/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-refreshTokens');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const userResponse = {
      id: user._id,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json(new ApiResponse(200, userResponse, 'User profile retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PATCH /api/users/me
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const { name, firstName, lastName } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Update fields if provided
    if (name) user.name = name;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified
    };

    res.json(new ApiResponse(200, userResponse, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account
 * @route DELETE /api/users/me
 */
const deleteUserAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.refreshTokens = [];
    await user.save();

    // ✅ CLEAR COOKIES ON ACCOUNT DELETION
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json(new ApiResponse(200, null, 'Account deactivated successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateGoogleLogin,
  handleGoogleCallback,
  refreshAccessToken,
  logout,
  getCurrentUser,
  updateUserProfile,
  deleteUserAccount
};