const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Sign a JWT token.
 * @param {Object} payload - Data to embed in the token (e.g., { id, role, email })
 * @returns {string} Signed JWT
 */
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

/**
 * Verify a JWT token and return the decoded payload.
 * @param {string} token - JWT token received from the client
 * @returns {Object} Decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
