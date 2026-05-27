// Authentication routes for ComRigX
const express = require('express');
const router = express.Router();
const {
  generateUserId,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  validateSessionToken,
  validatePhoneNumber,
  normalizePhoneNumber,
  validateUsername
} = require('../auth');

/**
 * @route POST /auth/signup
 * @desc Register a new user with phone, username, and password
 * @body { phoneNumber, username, password, displayName }
 * @returns { userId, username, displayName, sessionToken }
 */
router.post('/signup', (req, res) => {
  const { phoneNumber, username, password, displayName = '' } = req.body;
  const db = req.db;

  // Validation
  if (!phoneNumber || !username || !password) {
    return res.status(400).json({ error: 'Phone number, username, and password required' });
  }

  if (!validatePhoneNumber(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  if (!validateUsername(username)) {
    return res.status(400).json({
      error: 'Username must be 3-30 characters, start with a letter, contain only letters, numbers, and underscores'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Load existing users
  const users = db.loadUsers();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Check if phone already exists
  if (Object.values(users).some(u => u.phoneNumber === normalizedPhone)) {
    return res.status(409).json({ error: 'Phone number already registered' });
  }

  // Check if username already exists
  if (Object.values(users).some(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  // Hash password
  const { hash, salt } = hashPassword(password);

  // Generate unique user ID
  let userId;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    userId = generateUserId();
    isUnique = !users[userId];
    attempts++;
  }

  if (!isUnique) {
    return res.status(500).json({ error: 'Failed to generate unique user ID' });
  }

  const sessionToken = generateSessionToken(userId);

  // Create new user
  const newUser = {
    // Private Identity
    phoneNumber: normalizedPhone,
    passwordHash: hash,
    passwordSalt: salt,
    showPhoneNumber: false,

    // Public Identity
    userId,
    username,
    displayName: displayName || username,

    // Session
    sessionToken,
    sessionCreated: new Date().toISOString(),

    // Metadata
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Store in users database
  users[userId] = newUser;
  db.saveUsers(users);

  // Return user info (never send password hash or salt)
  return res.status(201).json({
    userId,
    username,
    displayName: newUser.displayName,
    sessionToken,
    message: 'Account created successfully'
  });
});

/**
 * @route POST /auth/login
 * @desc Authenticate user with phone and password
 * @body { phoneNumber, password }
 * @returns { userId, username, displayName, sessionToken }
 */
router.post('/login', (req, res) => {
  const { phoneNumber, password } = req.body;
  const db = req.db;

  if (!phoneNumber || !password) {
    return res.status(400).json({ error: 'Phone number and password required' });
  }

  const users = db.loadUsers();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Find user by phone number
  const user = Object.values(users).find(u => u.phoneNumber === normalizedPhone);

  if (!user) {
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }

  // Verify password
  if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }

  // Generate new session token
  const sessionToken = generateSessionToken(user.userId);
  user.sessionToken = sessionToken;
  user.sessionCreated = new Date().toISOString();
  user.lastSeen = new Date().toISOString();

  // Update user
  users[user.userId] = user;
  db.saveUsers(users);

  // Return user info
  return res.status(200).json({
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    sessionToken,
    message: 'Logged in successfully'
  });
});

/**
 * @route POST /auth/logout
 * @desc Logout user (clear session token)
 * @requires Authentication header with sessionToken
 */
router.post('/logout', (req, res) => {
  const sessionToken = req.headers.authorization?.split(' ')[1];
  const db = req.db;

  if (!sessionToken) {
    return res.status(400).json({ error: 'No session token provided' });
  }

  const tokenData = validateSessionToken(sessionToken);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  const users = db.loadUsers();
  const user = users[tokenData.userId];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Clear session
  user.sessionToken = null;
  user.sessionCreated = null;
  users[tokenData.userId] = user;
  db.saveUsers(users);

  return res.status(200).json({ message: 'Logged out successfully' });
});

/**
 * @route POST /auth/refresh
 * @desc Refresh session token to extend session
 * @requires Authentication header with sessionToken
 */
router.post('/refresh', (req, res) => {
  const sessionToken = req.headers.authorization?.split(' ')[1];
  const db = req.db;

  if (!sessionToken) {
    return res.status(400).json({ error: 'No session token provided' });
  }

  const tokenData = validateSessionToken(sessionToken);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  const users = db.loadUsers();
  const user = users[tokenData.userId];

  if (!user || user.sessionToken !== sessionToken) {
    return res.status(401).json({ error: 'Session token mismatch' });
  }

  // Generate new session token
  const newSessionToken = generateSessionToken(user.userId);
  user.sessionToken = newSessionToken;
  user.sessionCreated = new Date().toISOString();
  users[tokenData.userId] = user;
  db.saveUsers(users);

  return res.status(200).json({
    sessionToken: newSessionToken,
    message: 'Session refreshed'
  });
});

/**
 * @route GET /auth/me
 * @desc Get current authenticated user info
 * @requires Authentication header with sessionToken
 */
router.get('/me', (req, res) => {
  const sessionToken = req.headers.authorization?.split(' ')[1];
  const db = req.db;

  if (!sessionToken) {
    return res.status(401).json({ error: 'No session token provided' });
  }

  const tokenData = validateSessionToken(sessionToken);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  const users = db.loadUsers();
  const user = users[tokenData.userId];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Return public user info (never send password or sensitive data)
  return res.status(200).json({
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    phoneNumber: user.showPhoneNumber ? user.phoneNumber : null, // Only if user allows it
    showPhoneNumber: user.showPhoneNumber,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt
  });
});

module.exports = router;
