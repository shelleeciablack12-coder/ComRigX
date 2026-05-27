// User management routes for ComRigX
const express = require('express');
const router = express.Router();
const { validateSessionToken } = require('../auth');

/**
 * Middleware to verify authentication
 */
function requireAuth(req, res, next) {
  const sessionToken = req.headers.authorization?.split(' ')[1];

  if (!sessionToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const tokenData = validateSessionToken(sessionToken);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  req.userId = tokenData.userId;
  req.sessionToken = sessionToken;
  next();
}

/**
 * @route GET /users/search?query=searchTerm
 * @desc Search users by username or 12-digit ID
 * @query { query: string } - Search term (username or 12-digit ID)
 * @returns Array of matching users (public info only)
 */
router.get('/search', (req, res) => {
  const { query } = req.query;
  const db = req.db;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const users = db.loadUsers();
  const searchTerm = query.toLowerCase().trim();

  // Search by username or 12-digit ID
  const results = Object.values(users)
    .filter(u => {
      const usernameMatch = u.username.toLowerCase().includes(searchTerm);
      const idMatch = u.userId.includes(searchTerm);
      return usernameMatch || idMatch;
    })
    .map(u => ({
      userId: u.userId,
      username: u.username,
      displayName: u.displayName,
      phoneNumber: u.showPhoneNumber ? u.phoneNumber : null // Only if user allows visibility
    }))
    .slice(0, 50); // Limit to 50 results

  return res.status(200).json(results);
});

/**
 * @route GET /users/:userId
 * @desc Get user profile by 12-digit ID
 * @param { userId } - 12-digit user ID
 * @returns User public profile
 */
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const db = req.db;

  const users = db.loadUsers();
  const user = users[userId];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Return public info only
  return res.status(200).json({
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    phoneNumber: user.showPhoneNumber ? user.phoneNumber : null,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt
  });
});

/**
 * @route PUT /users/:userId/profile
 * @desc Update user profile (display name and privacy settings)
 * @requires Authentication
 * @param { userId } - 12-digit user ID (must match authenticated user)
 * @body { displayName?, showPhoneNumber? }
 */
router.put('/:userId/profile', requireAuth, (req, res) => {
  const { userId } = req.params;
  const { displayName, showPhoneNumber } = req.body;
  const db = req.db;

  // Only allow users to update their own profile
  if (userId !== req.userId) {
    return res.status(403).json({ error: 'Cannot update another user\'s profile' });
  }

  const users = db.loadUsers();
  const user = users[userId];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update allowed fields
  if (displayName !== undefined) {
    user.displayName = displayName || user.username; // Default to username if empty
  }

  if (showPhoneNumber !== undefined) {
    user.showPhoneNumber = Boolean(showPhoneNumber);
  }

  user.updatedAt = new Date().toISOString();
  users[userId] = user;
  db.saveUsers(users);

  return res.status(200).json({
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    showPhoneNumber: user.showPhoneNumber,
    message: 'Profile updated successfully'
  });
});

/**
 * @route GET /users
 * @desc Get list of online/active users (for messaging)
 * @requires Authentication
 * @query { limit?: number } - Limit results (default: 100)
 */
router.get('/', (req, res) => {
  const { limit = 100 } = req.query;
  const db = req.db;

  const users = db.loadUsers();
  const userList = Object.values(users)
    .map(u => ({
      userId: u.userId,
      username: u.username,
      displayName: u.displayName,
      lastSeen: u.lastSeen
    }))
    .slice(0, parseInt(limit));

  return res.status(200).json(userList);
});

module.exports = { router, requireAuth };
