# ComRigX Authentication System - Setup & Usage Guide

## Quick Start

### Server Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your settings
   ```

3. **Start the server:**
   ```bash
   npm start
   # Server will run on http://localhost:3001
   ```

### Client Setup

1. **Install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Configure backend URL (if not localhost:3001):**
   ```bash
   # Edit vite.config.js or use environment variable
   export VITE_BACKEND_URL=http://localhost:3001
   ```

3. **Start the client:**
   ```bash
   npm run dev
   # Client will run on http://localhost:5173
   ```

## Authentication Flow - Step by Step

### 1. User Registration (Signup)

1. Launch the app → See the Auth screen
2. Click "Sign up" tab
3. Enter:
   - **Phone Number**: Your phone number (10+ digits)
     - Example: `+1 (555) 123-4567` or `15551234567`
     - Formatting is flexible, stored normalized
   - **Username**: Your unique handle (3-30 characters)
     - Must start with a letter
     - Can contain letters, numbers, underscores
     - Example: `john_doe` or `JohnDoe123`
   - **Password**: At least 6 characters
   - **Display Name** (optional): How you appear in chats
     - If blank, defaults to your username
4. Click "Create Account"
5. **Automatically logged in** with session token
6. Session saved to browser (survives page refresh)

### 2. User Login

1. Go to Auth screen
2. Keep "Login" tab selected
3. Enter:
   - **Phone Number**: The number you signed up with
   - **Password**: Your account password
4. Click "Login"
5. **Session created** and saved to browser

### 3. Session Persistence

- **Automatic**: Refresh page → Still logged in
- **Manual**: Click "Logout" to clear session
- **Session expires**: After 30 days of inactivity
- **Multiple devices**: Each device has separate session

### 4. Start Messaging

1. **After login**, you see the chat interface
2. **View online contacts** in the left sidebar
3. **Search for users**:
   - By username: `john_doe`
   - By 12-digit ID: `20260526ABCD`
4. **Click a user** to open chat
5. **Type and send** messages
6. **Typing indicator** shows when others are typing

## User Privacy & Security

### Your Phone Number

- **Private by default** - Not visible to other users
- **Never searchable** - Others can't find you by phone
- **Login only** - Used exclusively for authentication
- **Optional visibility** - You can choose to show it in settings

**To show your phone number:**
1. Need to access profile settings (future feature)
2. Toggle "Show Phone Number" option
3. Only then will other users see it

### Your Public Identity

1. **Username** - Everyone can see and search
2. **Display Name** - Shows in messages and profile
3. **12-digit ID** - Permanent identifier, never changes
4. **Last Seen** - Shows when you were last active

### Password Security

- **Stored securely**: Hashed with PBKDF2 + Salt
- **Never stored plain text**: Even server admins can't see it
- **Only you know it**: Lost passwords require recovery (future feature)
- **Never shared**: Used only for your local device

## Common Tasks

### Change Display Name

**Coming soon:** Profile settings page

### Change Phone Visibility

**Coming soon:** Privacy settings in profile

### Search for Users

1. Use the search box in the sidebar
2. Type username or 12-digit ID
3. Results show username and display name
4. Click to start conversation

### View User Profile

1. Click on a user in conversations or search
2. Their profile shows:
   - Display Name
   - Username (@username)
   - Status (online/offline)
   - Last seen time
   - Phone number (if they allow visibility)

### Send Messages

1. Select a user from contacts
2. Type your message in the input box
3. Press Enter or click Send
4. Message appears on both devices instantly (if online)
5. Saved for later if user is offline

### See Typing Indicator

When someone is typing:
- "username is typing…" appears above messages
- Disappears 2 seconds after they stop typing
- Only visible in the active conversation

### Switch Accounts

1. Click "Logout" button (bottom of sidebar)
2. Session and stored data cleared
3. Auth screen reappears
4. Login with different phone number

### Logout & Login Quickly

- **Logout**: Clears session, requires password on next login
- **Auto-login**: Session persists for 30 days
- **Multiple devices**: Each device has separate login

## Technical Details

### Data Stored Locally (Browser)

```javascript
// localStorage keys
sessionToken      // Authentication token (expires 30 days)
userId            // Your 12-digit user ID
username          // Your username
displayName       // Your display name
theme             // Your theme preference (light/dark)
```

### User Information Shared in Chats

When sending a message, recipients see:
- Your display name (or username if blank)
- Your message content
- Timestamp of message

They **do NOT see**:
- Your phone number (unless you enabled visibility)
- Your 12-digit ID (internal only)
- Your password

### Server-side Data

**Stored in** `server/data/users.json`:
- Hashed password + salt (never plain text)
- Normalized phone number
- Public profile info
- Session token
- Activity timestamps

**Never stored:**
- Plain text passwords
- Unencrypted sensitive data

## Security Best Practices

### For Users

1. ✅ **Use strong passwords** (6+ chars, mix of types)
2. ✅ **Don't share passwords** with anyone
3. ✅ **Log out on shared devices**
4. ✅ **Enable phone visibility** only for trusted contacts
5. ❌ **Don't use phone number** as username (defeats privacy)
6. ❌ **Don't click links from unknown users** (future feature)
7. ❌ **Don't keep password in notes** or unencrypted files

### For Admins/Developers

1. Use HTTPS in production (all connections encrypted)
2. Set `NODE_ENV=production` on servers
3. Use strong `JWT_SECRET` (if implementing JWT)
4. Regularly backup `server/data/` directory
5. Monitor `server.log` for suspicious activity
6. Enable CORS only for trusted origins

## Troubleshooting

### "Invalid phone number"
- Add more digits (need 10+)
- Remove special characters
- Try: `15551234567` format

### "Username already taken"
- Choose a different username
- Add numbers or underscores
- Try: `john_doe_123`

### "Invalid password" after login
- Check if Caps Lock is on
- Ensure correct phone number entered
- Passwords are case-sensitive
- Reset in future via password recovery

### Session expires after refresh
- Token might be expired (30 days max)
- Try logging in again
- Clear browser storage if issues persist
- Check browser settings for cookie blocking

### Can't find a user
- Use exact username or 12-digit ID
- Search is case-insensitive but must match
- User might not be registered yet
- User might have hidden their account (future)

### Messages not sending
- Ensure recipient is in your contacts
- Check internet connection
- User might be offline (saves for later)
- Refresh page and try again

### Logout not working
- Force refresh page (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache
- Check browser console for errors

## File Structure

```
server/
├── auth.js                 # Authentication utilities
├── routes/
│   ├── auth.js            # Auth API endpoints
│   └── users.js           # User search/profile endpoints
├── db.js                  # File-based persistence
├── models.js              # Database schemas
├── index.js               # Main server file
├── data/
│   ├── users.json         # User accounts & sessions
│   ├── messages.json      # All messages
│   ├── conversations.json # Conversation metadata
│   └── unread.json        # Unread message counts
├── .env.example           # Example environment config
└── package.json           # Dependencies

client/
├── App.jsx                # Main chat component
├── Auth.jsx               # Login/signup component
├── App.css                # Chat styles
├── Auth.css               # Auth styles
└── main.jsx               # React entry point
```

## API Reference

### Authentication Endpoints

#### POST /api/auth/signup
Register new user
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "15551234567",
    "username": "john_doe",
    "password": "secure123",
    "displayName": "John Doe"
  }'
```

#### POST /api/auth/login
Authenticate user
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "15551234567",
    "password": "secure123"
  }'
```

#### GET /api/auth/me
Get current user
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/auth/me
```

#### POST /api/auth/logout
Logout user
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/auth/logout
```

### User Endpoints

#### GET /api/users/search?query=username
Search users
```bash
curl 'http://localhost:3001/api/users/search?query=john'
```

#### GET /api/users/:userId
Get user profile
```bash
curl http://localhost:3001/api/users/20260526ABCD
```

#### PUT /api/users/:userId/profile
Update profile
```bash
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"New Name","showPhoneNumber":true}' \
  http://localhost:3001/api/users/20260526ABCD
```

## Next Steps

1. **Test the system**: Create accounts and message
2. **Review** [AUTHENTICATION.md](AUTHENTICATION.md) for technical details
3. **Implement features**: Password recovery, 2FA, etc.
4. **Deploy**: Set up production environment
5. **Monitor**: Track usage and security

## Support

For issues or questions:
1. Check the AUTHENTICATION.md file
2. Review error messages (check browser console)
3. Check server logs (terminal output)
4. Review code comments in auth.js, routes/auth.js, Auth.jsx

## Security Notes

- This system uses file-based JSON storage (suitable for development)
- For production, migrate to MongoDB or PostgreSQL
- Implement HTTPS/TLS for all connections
- Consider adding:
  - Email verification for signups
  - Two-factor authentication
  - Password expiration policy
  - Audit logging
  - Rate limiting

Enjoy secure messaging with ComRigX! 🔒
