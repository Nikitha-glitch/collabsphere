/**
 * JWT Token Generation Utility
 * Handles creation of JWT tokens for authentication
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 * @param {string} userId - The user's MongoDB ID
 * @returns {string} - JWT token
 */
const generateToken = (userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );

  return token;
};

/**
 * Verify JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object} - Decoded token data
 * @throws {Error} - If token is invalid
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
