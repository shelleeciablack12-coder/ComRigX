// Authentication utilities for ComRigX
const crypto = require('crypto');

/**
 * Generate a 12-digit unique numeric ID
 * Format: 000000000000 to 999999999999 (randomly generated)
 * Note: Uniqueness must be checked by caller (in signup)
 */
function generateUserId() {
  // Generate 12 random digits
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += Math.floor(Math.random() * 10);
  }
  return id;
}

/**
 * Hash a password using PBKDF2
 * @param {string} password - Plain text password
 * @returns {object} { hash, salt }
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify a password against a stored hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Stored hash
 * @param {string} salt - Stored salt
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, hash, salt) {
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return verify === hash;
}

/**
 * Generate a secure session token (JWT-like but simpler for file-based system)
 * Format: userId.timestamp.randomString
 * @param {string} userId - The 12-digit user ID
 * @returns {string} Session token
 */
function generateSessionToken(userId) {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(32).toString('hex');
  return `${userId}.${timestamp}.${random}`;
}

/**
 * Parse and validate a session token
 * @param {string} token - Session token to validate
 * @param {number} maxAge - Maximum age of token in milliseconds (default: 30 days)
 * @returns {object|null} { userId, timestamp } if valid, null if invalid/expired
 */
function validateSessionToken(token, maxAge = 30 * 24 * 60 * 60 * 1000) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const userId = parts[0];
    const timestamp = parseInt(parts[1], 36);
    
    // Check if token is expired
    if (Date.now() - timestamp > maxAge) {
      return null;
    }

    return { userId, timestamp };
  } catch (error) {
    return null;
  }
}

/**
 * Validate phone number format
 * Supports common international formats
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function validatePhoneNumber(phone) {
  // Simple validation: 10+ digits, allowing +, -, spaces, parentheses
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  return /^\d{10,}$/.test(cleaned);
}

/**
 * Normalize phone number (remove formatting)
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number
 */
function normalizePhoneNumber(phone) {
  return phone.replace(/[\s\-().+]/g, '');
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid
 */
function validateUsername(username) {
  // 3-30 characters, alphanumeric + underscore, start with letter
  return /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/.test(username);
}

module.exports = {
  generateUserId,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  validateSessionToken,
  validatePhoneNumber,
  normalizePhoneNumber,
  validateUsername
};
