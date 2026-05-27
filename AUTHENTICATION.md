# ComRigX Authentication & Identity System

## Overview

This document describes the robust authentication and identity system for ComRigX, which separates **private identity** (for login security) from **public identity** (for user discovery).

## Architecture

### Private Identity (Login & Security)

**Phone Number** - The primary private identifier
- Used exclusively for account creation, login, password recovery, and security
- Normalized (stripped of formatting)
- Never exposed to other users unless they explicitly allow it
- Unique per account

**Password** - Secure authentication
- Minimum 6 characters
- Hashed using PBKDF2 (100,000 iterations, SHA-512)
- Salted for additional security
- Never stored in plain text

**Phone Visibility Setting** - Privacy control
- Default: Hidden from other users
- Controlled by user in profile settings
- Only revealed to other users if explicitly enabled

### Public Identity (User Discovery)

**12-Digit User ID** - Permanent unique identifier
- Format: YYYYMMDD + 4 random hex characters
- Example: `20260526A1B2`
- Automatically generated at signup
- Never changes
- Used as fallback for finding accounts

**Username** - Searchable, unique identifier
- 3-30 characters
- Must start with a letter
- Can contain letters, numbers, underscores
- Searchable in user directory
- Displayed in messages and profiles

**Display Name** - Customizable appearance
- Editable by user
- Does not need to be unique
- Shown in chat messages and profiles
- Can be changed anytime

## Authentication Flow

### User Registration (Signup)

```
POST /api/auth/signup
Body: {
  phoneNumber: string,    // Normalized to digits only
  username: string,       // 3-30 chars, alphanumeric + underscore
  password: string,       // Min 6 chars
  displayName: string     // Optional, defaults to username
}

Response (201): {
  userId: string,         // 12-digit ID
  username: string,
  displayName: string,
  sessionToken: string,   // JWT-like token for session persistence
  message: string
}
```

**Process:**
1. Validate all inputs (format, length, uniqueness)
2. Hash password with salt
3. Generate 12-digit user ID
4. Create user record in database
5. Generate and store session token
6. Return user info and session token
7. Client stores session token in localStorage

### User Login

```
POST /api/auth/login
Body: {
  phoneNumber: string,    // Phone number used at signup
  password: string        // Account password
}

Response (200): {
  userId: string,
  username: string,
  displayName: string,
  sessionToken: string,
  message: string
}
```

**Process:**
1. Find user by phone number
2. Verify password against stored hash
3. Generate new session token
4. Update last seen timestamp
5. Return user info and new session token

### Session Persistence

**On App Load:**
```javascript
// Client checks localStorage on mount
const token = localStorage.getItem('sessionToken');
if (token) {
  // Use existing session, no re-login needed
  socket.emit('authenticate', { sessionToken: token });
}
```

**Session Token Refresh:**
```
POST /api/auth/refresh
Headers: { Authorization: "Bearer <sessionToken>" }

Response (200): {
  sessionToken: string    // New token to extend session
}
```

**Session Duration:** 30 days (configurable in auth.js)

### Session Management

**Get Current User:**
```
GET /api/auth/me
Headers: { Authorization: "Bearer <sessionToken>" }

Response (200): {
  userId: string,
  username: string,
  displayName: string,
  phoneNumber: string|null,  // Only if user allows visibility
  showPhoneNumber: boolean,
  lastSeen: ISO8601,
  createdAt: ISO8601
}
```

**Logout:**
```
POST /api/auth/logout
Headers: { Authorization: "Bearer <sessionToken>" }

Response (200): {
  message: string
}
```

## User Search & Discovery

### Search by Username or ID

```
GET /api/users/search?query=queryTerm
Query params: {
  query: string  // Min 2 chars, searches username and 12-digit ID
}

Response (200): [
  {
    userId: string,
    username: string,
    displayName: string,
    phoneNumber: string|null  // Only if user allows visibility
  },
  ...
]
```

**Limitations:**
- Returns max 50 results
- Phone number search is disabled (only searchable by username or 12-digit ID)
- Phone number only visible if user has explicitly enabled it

### Get User by ID

```
GET /api/users/:userId

Response (200): {
  userId: string,
  username: string,
  displayName: string,
  phoneNumber: string|null,
  lastSeen: ISO8601,
  createdAt: ISO8601
}
```

## Profile Management

### Update Profile

```
PUT /api/users/:userId/profile
Headers: { Authorization: "Bearer <sessionToken>" }
Body: {
  displayName?: string,        // Optional update
  showPhoneNumber?: boolean    // Optional update
}

Response (200): {
  userId: string,
  username: string,
  displayName: string,
  showPhoneNumber: boolean,
  message: string
}
```

**Notes:**
- Users can only update their own profile
- Display name can be changed anytime
- Phone visibility toggle is under user control
- Username cannot be changed (permanent identifier)

## Socket.IO Authentication

### Authentication on Connection

```javascript
// Client
socket.emit('authenticate', { sessionToken: token });

// Server receives, validates token, and responds
socket.on('authSuccess', (userData) => {
  // User is now authenticated on this socket connection
});

socket.on('authError', (error) => {
  // Authentication failed, clear stored session
});
```

### Socket Events with Authentication

All socket emissions use user IDs instead of usernames:

**Send Message:**
```javascript
socket.emit('privateMessage', {
  toUserId: string,    // Recipient's 12-digit ID
  text: string
});
```

**Select Chat:**
```javascript
socket.emit('selectChat', userId);  // 12-digit ID
```

**Typing Indicator:**
```javascript
socket.emit('typing', { toUserId: string });
```

## Database Structure

### User Record (file-based JSON)

```json
{
  "20260526ABCD": {
    "phoneNumber": "15551234567",
    "passwordHash": "hex_string...",
    "passwordSalt": "hex_string...",
    "showPhoneNumber": false,
    
    "userId": "20260526ABCD",
    "username": "john_doe",
    "displayName": "John Doe",
    
    "sessionToken": "20260526ABCD.hash.random",
    "sessionCreated": "2026-05-26T10:30:00Z",
    
    "lastSeen": "2026-05-26T10:35:00Z",
    "createdAt": "2026-05-26T08:00:00Z",
    "updatedAt": "2026-05-26T10:35:00Z"
  }
}
```

### Message Record

```json
{
  "id": "convId-timestamp",
  "from": "20260526ABCD",           // Sender's user ID
  "to": "20260526CDEF",             // Recipient's user ID
  "fromUsername": "john_doe",       // Sender's username
  "fromDisplayName": "John Doe",    // Sender's display name
  "text": "Hello!",
  "conversationId": "20260526ABCD--20260526CDEF",
  "timestamp": "2026-05-26T10:35:00Z",
  "isRead": false
}
```

## Security Features

### Password Security
- PBKDF2 hashing with 100,000 iterations
- Random salt per password
- Secure comparison to prevent timing attacks

### Session Security
- Session tokens include userId, timestamp, and random component
- Tokens expire after 30 days
- Tokens are validated before each use
- Session tokens only transmitted over HTTPS in production

### Privacy Controls
- Phone number hidden by default
- Users can toggle phone visibility anytime
- Phone number never searchable (only by direct login)
- Display name can be changed without affecting identity

### Input Validation
- Phone number: 10+ digits
- Username: Alphanumeric + underscore, 3-30 chars
- Password: Minimum 6 characters
- Display name: Any characters, optional

## Client Implementation

### Session Persistence

```javascript
// On app mount
useEffect(() => {
  const token = localStorage.getItem('sessionToken');
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  
  if (token && userId && username) {
    setIsAuthenticated(true);
    setUserId(userId);
    setUsername(username);
    // Connect socket with token
  }
}, []);
```

### Authentication Flow

```javascript
const handleAuthSuccess = (authData) => {
  localStorage.setItem('sessionToken', authData.sessionToken);
  localStorage.setItem('userId', authData.userId);
  localStorage.setItem('username', authData.username);
  localStorage.setItem('displayName', authData.displayName);
  setIsAuthenticated(true);
};
```

### Logout

```javascript
const handleLogout = () => {
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('displayName');
  setIsAuthenticated(false);
  socket.disconnect();
};
```

## API Error Responses

### Authentication Errors

```
401 Unauthorized
{
  error: "Invalid or expired session token"
}

401 Unauthorized
{
  error: "Invalid phone number or password"
}

409 Conflict
{
  error: "Phone number already registered"
}

409 Conflict
{
  error: "Username already taken"
}

400 Bad Request
{
  error: "Phone number, username, and password required"
}
```

## Configuration

### Token Settings (auth.js)

```javascript
const MAX_TOKEN_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const HASH_ALGORITHM = 'sha512';
```

## Migration Notes

**For existing users without authentication:**
- This is a new system for new signups
- Existing demo users should be migrated or removed
- Consider maintaining backward compatibility during transition

## Privacy Best Practices

1. **Default Privacy**: Phone numbers are hidden by default
2. **User Control**: Users can toggle visibility in settings
3. **No Search Exposure**: Phone numbers cannot be found via search
4. **Login-only Use**: Phone numbers only used for authentication
5. **Username-based Discovery**: Use permanent username for finding contacts
6. **Fallback ID**: 12-digit ID provides secondary lookup method

## Scalability

- **User ID Format**: 8-digit date + 4-digit random = billions of unique IDs
- **Permanent IDs**: Users can be found even if username changes (future feature)
- **Session Management**: File-based (can be migrated to Redis/Memcached)
- **User Search**: Indexed by username and ID for fast lookups

## Future Enhancements

- Two-factor authentication (SMS/email verification)
- Username changes with redirect
- Account recovery via email
- Device/session management
- Login history and suspicious activity alerts
- Password strength requirements
- Account deactivation/deletion
