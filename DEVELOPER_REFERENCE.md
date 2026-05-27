# Developer Quick Reference

## 🎯 Key Files & Their Purpose

### Authentication Core

**`server/auth.js`** - Authentication utilities
```javascript
generateUserId()              // Create 12-digit ID
hashPassword(password)        // Hash with PBKDF2 + Salt
verifyPassword(pwd, hash, salt) // Verify password
generateSessionToken(userId)  // Create session token
validateSessionToken(token)   // Verify token validity
validatePhoneNumber(phone)    // Format check
normalizePhoneNumber(phone)   // Strip formatting
validateUsername(username)    // Format check
```

**`server/routes/auth.js`** - Auth endpoints
```
POST   /api/auth/signup      // Create account
POST   /api/auth/login       // Authenticate
POST   /api/auth/logout      // Clear session
POST   /api/auth/refresh     // Extend session
GET    /api/auth/me          // Current user info
```

**`server/routes/users.js`** - User management
```
GET    /api/users/search     // Search by username/ID
GET    /api/users/:userId    // Get profile
PUT    /api/users/:userId/profile  // Update profile
GET    /api/users            // List all users
```

### Server Integration

**`server/index.js`** - Main entry point
- Express app setup
- Socket.IO connection handling
- Route registration
- REST endpoints for data fetching
- Socket events (authenticate, privateMessage, selectChat, typing)

**`server/db.js`** - Persistence layer
- File-based JSON storage
- Load/save functions for users, messages, conversations, unreads

**`server/models.js`** - Data schemas
- Enhanced User schema with auth fields
- Message schema with display name fields
- Conversation and UnreadStatus schemas

### Client Authentication

**`client/Auth.jsx`** - Auth UI
```javascript
// Props
onAuthSuccess(authData)   // Called on login/signup
backendUrl               // Backend URL

// Features
- Login tab (phone + password)
- Signup tab (phone + username + password + displayName)
- Input validation with feedback
- Error messages
- Password toggle
```

**`client/App.jsx`** - Chat with auth
```javascript
// Auth state
isAuthenticated      // true/false
userId              // 12-digit ID
username            // Username
displayName         // Display name
sessionToken        // Auth token

// Auth functions
handleAuthSuccess()  // Process login/signup
handleLogout()      // Clear session

// Socket auth
socket.emit('authenticate', {sessionToken})
```

---

## 🔄 Authentication Flow in Code

### 1. Signup Flow

```javascript
// Client - Auth.jsx
const handleSignup = async (e) => {
  // Validate inputs
  // POST /api/auth/signup with phone, username, password, displayName
  // Receive: { userId, username, displayName, sessionToken }
  // Store all in localStorage
  // Call onAuthSuccess(authData)
  // App sets state and connects socket
}

// Server - routes/auth.js
router.post('/signup', (req, res) => {
  // Validate phone, username, password format
  // Check if phone/username already exists
  // Hash password with salt
  // Generate 12-digit userId
  // Create user record in users.json
  // Generate sessionToken
  // Return user info + token
})
```

### 2. Login Flow

```javascript
// Client - Auth.jsx
const handleLogin = async (e) => {
  // Validate inputs
  // POST /api/auth/login with phone, password
  // Receive: { userId, username, displayName, sessionToken }
  // Store in localStorage
  // Call onAuthSuccess(authData)
}

// Server - routes/auth.js
router.post('/login', (req, res) => {
  // Validate phone, password provided
  // Find user by phone number (normalized)
  // Verify password against hash + salt
  // Generate new sessionToken
  // Update user.lastSeen
  // Return user info + token
})
```

### 3. Socket Authentication

```javascript
// Client - App.jsx (after auth)
useEffect(() => {
  const socket = io(BACKEND_URL);
  socket.on('connect', () => {
    // Send token to authenticate
    socket.emit('authenticate', { sessionToken })
  })
}, [sessionToken])

// Server - index.js
io.on('connection', (socket) => {
  socket.on('authenticate', (data) => {
    // Validate sessionToken
    // Get userId from token
    // Get user from users.json
    // Attach userId to socket.data
    // Emit authSuccess
    // Register in onlineUsers
  })
})
```

### 4. Sending Messages with Auth

```javascript
// Client - App.jsx
const handleSend = () => {
  socket.emit('privateMessage', {
    toUserId: selectedUser.userId,  // 12-digit ID
    text: message
  })
}

// Server - index.js
socket.on('privateMessage', ({ toUserId, text }) => {
  const fromUserId = socket.data.userId  // From auth
  const fromUser = users[fromUserId]
  
  // Create message with userIds + display names
  const message = {
    from: fromUserId,
    to: toUserId,
    fromUsername: fromUser.username,
    fromDisplayName: fromUser.displayName,
    text: text,
    // ... other fields
  }
  
  // Save and emit
})
```

### 5. Session Persistence

```javascript
// Client - App.jsx (on mount)
useEffect(() => {
  const token = localStorage.getItem('sessionToken')
  if (token) {
    setSessionToken(token)
    setUserId(localStorage.getItem('userId'))
    setUsername(localStorage.getItem('username'))
    setDisplayName(localStorage.getItem('displayName'))
    setIsAuthenticated(true)
  }
}, [])

// Then socket connects automatically with token
```

---

## 📊 Data Structures

### User Object (in memory)
```javascript
{
  "20260526ABCD": {
    // Private (auth)
    phoneNumber: "15551234567",
    passwordHash: "hex...",
    passwordSalt: "hex...",
    showPhoneNumber: false,
    
    // Public
    userId: "20260526ABCD",
    username: "john_doe",
    displayName: "John Doe",
    
    // Session
    sessionToken: "20260526ABCD.hash.random",
    sessionCreated: "2026-05-26T10:30:00Z",
    
    // Metadata
    lastSeen: "2026-05-26T10:35:00Z",
    createdAt: "2026-05-26T08:00:00Z"
  }
}
```

### Message Object
```javascript
{
  id: "convId-timestamp",
  from: "20260526ABCD",           // UserId
  to: "20260526CDEF",             // UserId
  fromUsername: "john_doe",
  fromDisplayName: "John Doe",
  text: "Hello!",
  conversationId: "20260526ABCD--20260526CDEF",
  timestamp: "2026-05-26T10:35:00Z",
  isRead: false
}
```

### Socket Data (authenticated)
```javascript
socket.data = {
  userId: "20260526ABCD",
  username: "john_doe",
  displayName: "John Doe"
}
```

---

## 🛡️ Security Checks

### Password Hashing
```javascript
// Sign up
const {hash, salt} = hashPassword(password)
// Stored: hash, salt (never plain password)

// Login
const verified = verifyPassword(inputPassword, storedHash, storedSalt)
```

### Token Validation
```javascript
// Generate
const token = generateSessionToken(userId)
// Format: userId.timestamp.randomHash

// Validate
const data = validateSessionToken(token)
// Returns: { userId, timestamp } or null
```

### Input Validation
```javascript
// Phone: 10+ digits (after removing formatting)
validatePhoneNumber("(555) 123-4567")  // true

// Username: 3-30 chars, start with letter, alphanumeric + _
validateUsername("john_doe123")  // true

// Format errors should be caught before hashing
```

---

## 🔌 Socket Events (Authenticated)

### Client → Server

```javascript
socket.emit('authenticate', { sessionToken })
socket.emit('getUsers')
socket.emit('selectChat', userId)
socket.emit('privateMessage', { toUserId, text })
socket.emit('typing', { toUserId })
```

### Server → Client

```javascript
socket.emit('authSuccess', userData)
socket.emit('authError', {error})
socket.emit('userList', [{userId, username, displayName}])
socket.emit('conversationSelected', {conversationId, messages})
socket.emit('conversationMessage', {conversation, message})
socket.emit('userTyping', {conversationId, typingUsernames})
socket.emit('error', {error})
```

---

## 🚀 Common Tasks

### Add a New Auth Endpoint
```javascript
// In server/routes/auth.js
router.post('/newEndpoint', (req, res) => {
  const sessionToken = req.headers.authorization?.split(' ')[1]
  const tokenData = validateSessionToken(sessionToken)
  if (!tokenData) {
    return res.status(401).json({error: 'Not authenticated'})
  }
  
  const db = req.db
  const users = db.loadUsers()
  // ... do something with tokenData.userId
})
```

### Add Auth Middleware
```javascript
function requireAuth(req, res, next) {
  const sessionToken = req.headers.authorization?.split(' ')[1]
  const tokenData = validateSessionToken(sessionToken)
  if (!tokenData) {
    return res.status(401).json({error: 'Authentication required'})
  }
  req.userId = tokenData.userId
  next()
}

// Use: router.get('/protected', requireAuth, (req, res) => {...})
```

### Check Auth in Socket
```javascript
socket.on('someEvent', (data) => {
  const userId = socket.data.userId
  if (!userId) {
    socket.emit('error', {error: 'Not authenticated'})
    return
  }
  // ... use userId
})
```

---

## 🐛 Debugging Tips

### Check User Registration
```bash
# Look in server/data/users.json
cat server/data/users.json
# Should see userId as key with user object as value
```

### Check Session Token
```javascript
// In browser console
localStorage.getItem('sessionToken')
// Should be: "userId.timestamp.random"
```

### Check Socket Auth
```javascript
// Server console output
✅ Socket connected: socket.id
✅ Socket authenticated: {userId, username, displayName}

// If you see error instead
❌ Socket auth error: Invalid or expired session token
```

### Verify Message Storage
```bash
# Check messages were saved
cat server/data/messages.json | head -20

# Should see messages with from/to as userIds (not usernames)
```

### Check Online Users
```javascript
// In index.js, onlineUsers object
console.log('Online:', onlineUsers)
// Should be: { "20260526ABCD": { userId, username, displayName, socketId } }
```

---

## 📋 Testing Scenarios

### Scenario 1: Basic Auth
1. Signup with phone, username, password
2. Check localStorage has sessionToken, userId, username
3. Verify user record in server/data/users.json
4. Logout and login again

### Scenario 2: Session Persistence
1. Login
2. Refresh page (Ctrl+F5)
3. Should still be logged in
4. Should connect socket automatically

### Scenario 3: Messaging
1. Signup as User A
2. Signup as User B
3. A sends message to B
4. B receives with A's displayName
5. Check messages.json has both userIds

### Scenario 4: Search
1. Create User A (@alice)
2. Create User B (@bob)
3. As B, search for "alice"
4. Should find A by username
5. Should not see A's phone number

### Scenario 5: Error Handling
1. Try signup with username already taken
2. Try login with wrong password
3. Try accessing /api/auth/me without token
4. All should give clear error messages

---

## 📚 Key Imports

```javascript
// In auth.js
const crypto = require('crypto')

// In routes/auth.js
const express = require('express')
const { validateSessionToken, ... } = require('../auth')

// In App.jsx
import Auth from './Auth'
import { io } from 'socket.io-client'

// In Auth.jsx
import React, { useState } from 'react'
```

---

## ⚙️ Configuration Points

### Token Expiration (auth.js)
```javascript
const MAX_TOKEN_AGE = 30 * 24 * 60 * 60 * 1000  // Change here
```

### Server Port (index.js)
```javascript
const PORT = process.env.PORT || 3001  // Change here
```

### Backend URL (App.jsx)
```javascript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
```

### CORS Origins (.env)
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
```

---

## ✅ Checklist for New Developers

- [ ] Read AUTHENTICATION.md for full technical specs
- [ ] Read SETUP_GUIDE.md for setup instructions
- [ ] Review auth.js - understand password hashing
- [ ] Review routes/auth.js - understand endpoints
- [ ] Review App.jsx - understand client auth flow
- [ ] Review Auth.jsx - understand form UI
- [ ] Test signup/login flow locally
- [ ] Test session persistence (refresh page)
- [ ] Test messaging with userIds
- [ ] Check server/data/ files during testing
- [ ] Read error messages in console
- [ ] Ask questions in PR reviews

---

**Status**: ✅ Production-Ready (file-based storage)
**Next**: Migrate to MongoDB/PostgreSQL for scale
