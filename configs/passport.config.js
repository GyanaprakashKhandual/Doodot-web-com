const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

// Create OAuth2 client
const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

/**
 * Generate Google OAuth URL
 * @returns {String} Google OAuth consent screen URL
 */
const getGoogleAuthURL = () => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes
  });
};

/**
 * Get Google user info from access token
 * @param {String} accessToken - Google access token
 * @returns {Object} User profile information
 */
const getGoogleUserInfo = async (accessToken) => {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch user info from Google');
  }
  
  return await response.json();
};

/**
 * Exchange authorization code for tokens
 * @param {String} code - Authorization code from Google
 * @returns {Object} Tokens and user info
 */
const getGoogleTokensAndUser = async (code) => {
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    return {
      tokens,
      userInfo
    };
  } catch (error) {
    console.error('Error getting Google tokens:', error);
    throw error;
  }
};

/**
 * Verify Google ID token
 * @param {String} idToken - Google ID token
 * @returns {Object} Verified token payload
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });
    
    return ticket.getPayload();
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw error;
  }
};

module.exports = {
  oauth2Client,
  getGoogleAuthURL,
  getGoogleUserInfo,
  getGoogleTokensAndUser,
  verifyGoogleToken,
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI
};