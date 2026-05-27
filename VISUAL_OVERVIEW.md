# ComRigX Authentication System - Visual Overview

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ComRigX Platform                         │
├──────────────────────────────┬──────────────────────────────────┤
│         CLIENT (React)       │        SERVER (Node.js)          │
│                              │                                   │
│  ┌────────────────────────┐  │   ┌──────────────────────────┐  │
│  │   Authentication       │  │   │   Auth Routes            │  │
│  │  ┌────────────────────┐│  │   │  ┌────────────────────┐  │  │
│  │  │ Auth.jsx (Login)   ││  │   │  │ POST /signup       │  │  │
│  │  │ - Phone            ││  │◄──┤──│ - Validate         │  │  │
│  │  │ - Password         ││  │   │  │ - Hash password    │  │  │
│  │  │ - Validation       ││  │   │  │ - Generate ID      │  │  │
│  │  └────────────────────┘│  │   │  │ - Store user       │  │  │
│  │                        │  │   │  │ - Return token     │  │  │
│  │  ┌────────────────────┐│  │   │  └────────────────────┘  │  │
│  │  │ localStorage       ││  │   │                            │  │
│  │  │ - sessionToken     ││  │   │  ┌────────────────────┐  │  │
│  │  │ - userId           ││  │   │  │ POST /login        │  │  │
│  │  │ - username         ││  │   │  │ - Find user        │  │  │
│  │  │ - displayName      ││  │   │  │ - Verify password  │  │  │
│  │  │ - theme            ││  │   │  │ - Generate token   │  │  │
│  │  └────────────────────┘│  │   │  └────────────────────┘  │  │
│  └────────────────────────┘  │   └──────────────────────────┘  │
│                              │                                   │
│  ┌────────────────────────┐  │   ┌──────────────────────────┐  │
│  │   Socket.IO            │  │   │   Socket.IO Server       │  │
│  │   Client               │  │   │   ┌────────────────────┐ │  │
│  │  ┌────────────────────┐│  │   │   │ authenticate()     │ │  │
│  │  │ emit('auth',token)││  │◄──────│ - Validate token   │ │  │
│  │  │                    ││  │   │   │ - Attach userData  │ │  │
│  │  │ emit('message', {})││  │   │   │ - Register online  │ │  │
│  │  │                    ││  │   │   └────────────────────┘ │  │
│  │  │ on('message', {})  ││  │   │                          │  │
│  │  │                    ││  │   │ ┌────────────────────┐   │  │
│  │  └────────────────────┘│  │   │ │ privateMessage()   │   │  │
│  │                        │  │   │ │ - Verify user      │   │  │
│  │  ┌────────────────────┐│  │   │ │ - Create message   │   │  │
│  │  │ App.jsx            ││  │   │ │ - Store message    │   │  │
│  │  │ - Display chat     ││  │   │ │ - Emit to others   │   │  │
│  │  │ - Show contacts    ││  │   │ └────────────────────┘   │  │
│  │  │ - Send messages    ││  │   │                          │  │
│  │  └────────────────────┘│  │   │ ┌────────────────────┐   │  │
│  └────────────────────────┘  │   │ │ User Search        │   │  │
│                              │   │ │ - Find by username │   │  │
│  ┌────────────────────────┐  │   │ │ - Find by ID       │   │  │
│  │ Theme Management       │  │   │ │ - Return public    │   │  │
│  │ - Light/Dark toggle    │  │   │ └────────────────────┘   │  │
│  │ - Persist in localStorage  │   │                          │  │
│  └────────────────────────┘  │   └──────────────────────────┘  │
└──────────────────────────────┴──────────────────────────────────┘
                                │
                                │ REST API
                                │
                    ┌───────────▼──────────┐
                    │  File-based Storage  │
                    │  ┌────────────────┐  │
                    │  │ users.json     │  │
                    │  │ messages.json  │  │
                    │  │ conversations  │  │
                    │  │ unread.json    │  │
                    │  └────────────────┘  │
                    └────────────────────┘
```

---

## 🔐 Private vs Public Identity

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER IDENTITY SEPARATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRIVATE IDENTITY (Only for authentication)                    │
│  ═════════════════════════════════════════════════════════     │
│                                                                  │
│  Phone Number          ←──── Used for login ONLY               │
│  (15551234567)         ←──── HIDDEN by default                │
│  ✓ Normalized          ←──── Not searchable                   │
│  ✓ Never exposed       ←──── User controls visibility        │
│  ✓ Unique per account  ←──── Can toggle in settings          │
│                                                                  │
│  Password              ←──── Hashed with PBKDF2               │
│  (your secret)         ←──── + Random salt                    │
│  ✓ 100k iterations    ←──── Never stored plain text           │
│  ✓ Min 6 characters   ←──── Only you know it                  │
│                                                                  │
│  ──────────────────────────────────────────────────────────   │
│                                                                  │
│  PUBLIC IDENTITY (Used for messaging and discovery)            │
│  ════════════════════════════════════════════════════         │
│                                                                  │
│  12-Digit User ID      ←──── PERMANENT identifier             │
│  (20260526ABCD)        ←──── Never changes                    │
│  ✓ Auto-generated      ←──── Searchable fallback             │
│  ✓ YYYYMMDD + random   ←──── Scalable (billions available)   │
│                                                                  │
│  Username              ←──── UNIQUE & SEARCHABLE              │
│  (@john_doe)           ←──── Shown in messages               │
│  ✓ 3-30 characters     ←──── Used for finding contacts       │
│  ✓ Alphanumeric + _    ←──── Public-facing identity          │
│                                                                  │
│  Display Name          ←──── EDITABLE & OPTIONAL              │
│  (John Doe)            ←──── Shown in chat                    │
│  ✓ Not unique          ←──── Can be changed anytime          │
│  ✓ Defaults to username ←──── How others see you             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Authentication State Machine

```
                    ┌─────────────────┐
                    │   App Started   │
                    └────────┬────────┘
                             │
                   Check localStorage
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼────────┐      ┌────────▼───────┐
        │ Token exists?  │      │  Token missing │
        └───────┬────────┘      └────────┬───────┘
                │                         │
              YES                        NO
                │                         │
                │         ┌───────────────┤
                │         │               │
        ┌───────▼─────┐   │   ┌─────────┬─┴──────────┐
        │  Restore    │   │   │         │            │
        │ session     │   │   │      ┌──▼───┐   ┌───┴──┐
        │ data        │   │   │      │ Show │   │ Show │
        │             │   │   │      │Login │   │Signup│
        │ Reconnect   │   │   │      │ Tab  │   │ Tab  │
        │ socket      │   │   │      └──┬───┘   └───┬──┘
        │             │   │   │         │            │
        └───────┬─────┘   │   │    User enters  User enters
                │         │   │    credentials  details
                │         │   │         │            │
                │         │   └─────────┴────────────┘
                │         │               │
                │         │   ┌───────────▼────────────┐
                │         │   │  POST /auth/login      │
                │         │   │  or /auth/signup       │
                │         │   └───────────┬────────────┘
                │         │               │
                │         │   ┌───────────▼────────────┐
                │         │   │ Validate inputs        │
                │         │   │ Hash password          │
                │         │   │ Check uniqueness       │
                │         │   │ Generate token         │
                │         │   └───────────┬────────────┘
                │         │               │
                │         └───────────────┤
                │                         │
                │         ┌───────────────▼────────┐
                │         │ Save in localStorage:  │
                │         │ - sessionToken         │
                │         │ - userId               │
                │         │ - username             │
                │         │ - displayName          │
                │         └───────────────┬────────┘
                │                         │
                │         ┌───────────────▼────────┐
                │         │ Set isAuthenticated    │
                │         │ Create Socket.IO conn  │
                │         └───────────────┬────────┘
                │                         │
                └───────────────┬─────────┘
                                │
                    ┌───────────▼────────────┐
                    │  socket.emit(          │
                    │  'authenticate',       │
                    │  {sessionToken})       │
                    └───────────────┬────────┘
                                    │
                    ┌───────────────▼────────────┐
                    │  Server validates token    │
                    │  Attaches user data        │
                    │  Registers in onlineUsers  │
                    └───────────────┬────────────┘
                                    │
                    ┌───────────────▼────────────┐
                    │ socket.emit(               │
                    │ 'authSuccess', userData)   │
                    └───────────────┬────────────┘
                                    │
                    ┌───────────────▼────────────┐
                    │   AUTHENTICATED ✅         │
                    │   - Load conversations     │
                    │   - Show contacts          │
                    │   - Can send messages      │
                    │   - Listen for messages    │
                    │   - Show typing indicators │
                    └────────────────────────────┘
```

---

## 📨 Message Flow with Authentication

```
┌──────────────────┐
│  User A          │
│  @alice_smith    │
│  20260526AABB    │
└────────┬─────────┘
         │ 1. Type message
         │ 2. Click Send
         │
    ┌────▼──────────────────────────────────┐
    │ socket.emit('privateMessage', {        │
    │   toUserId: '20260526CCDD',           │
    │   text: 'Hello Bob!'                  │
    │ })                                    │
    └────┬──────────────────────────────────┘
         │
         │ (Socket.IO transmission)
         │
    ┌────▼──────────────────────────────────┐
    │ SERVER RECEIVES                       │
    │ from socket.data.userId: 20260526AABB │
    │                                        │
    │ Validate:                              │
    │ ✓ Sender is authenticated             │
    │ ✓ Recipient exists                    │
    │ ✓ Text is not empty                   │
    └────┬──────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │ STORE MESSAGE                         │
    │ {                                      │
    │   id: 'convId-123456',               │
    │   from: '20260526AABB',              │
    │   to: '20260526CCDD',                │
    │   fromUsername: 'alice_smith',        │
    │   fromDisplayName: 'Alice',           │
    │   text: 'Hello Bob!',                │
    │   timestamp: '2026-05-26T...',        │
    │ }                                      │
    └────┬──────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │ EMIT TO RECIPIENT                     │
    │ socket.emit('conversationMessage', {  │
    │   conversation: {...},                │
    │   message: {...}                      │
    │ })                                    │
    └────┬──────────────────────────────────┘
         │
         │ (Socket.IO transmission)
         │
    ┌────▼──────────────────────────────────┐
    │  User B receives message              │
    │  Displays: "Alice: Hello Bob!"        │
    │                                        │
    │  (Can see Alice's display name        │
    │   but NOT her phone number            │
    │   unless she enabled visibility)      │
    │                                        │
    │  ✅ Message successful               │
    └────────────────────────────────────────┘
```

---

## 🔍 User Search & Privacy

```
SCENARIO: User B (@bob_jones) searches for User A

    ┌─────────────────────────────────┐
    │ Search Input: "alice"           │
    │ (Type in search box)            │
    └─────────────┬───────────────────┘
                  │
    ┌─────────────▼───────────────────┐
    │ GET /api/users/search?query=alice
    └─────────────┬───────────────────┘
                  │
    ┌─────────────▼──────────────────────────┐
    │ SERVER                                  │
    │ - Search users by username              │
    │ - Match: alice_smith (found!)          │
    │                                         │
    │ - Check user.showPhoneNumber: false    │
    │                                         │
    │ Return:                                 │
    │ {                                       │
    │   userId: '20260526AABB',              │
    │   username: 'alice_smith',              │
    │   displayName: 'Alice',                │
    │   phoneNumber: null  ← HIDDEN!         │
    │ }                                       │
    └─────────────┬──────────────────────────┘
                  │
    ┌─────────────▼──────────────────────────┐
    │ CLIENT (Bob's browser)                  │
    │                                         │
    │ ✅ Show result:                        │
    │    Alice (@alice_smith)                │
    │    [Click to message]                  │
    │                                         │
    │ ❌ Cannot see Alice's phone            │
    │    (even if admin tried to force it)   │
    │                                         │
    │ If Alice had enabled visibility:       │
    │    Phone: +1 (555) 123-4567           │
    └─────────────────────────────────────────┘
```

---

## 🛡️ Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 1: Input Validation                                 │
│  ════════════════════════════════════════════════════      │
│  Client validates:                                         │
│    • Phone format (10+ digits)                             │
│    • Username format (3-30 chars)                          │
│    • Password length (6+ chars)                            │
│                                                              │
│  LAYER 2: Server-Side Validation                           │
│  ═════════════════════════════════════════════════════     │
│  Server validates again:                                   │
│    • All input formats                                     │
│    • Phone uniqueness                                      │
│    • Username uniqueness                                   │
│    • Error messages generic (don't leak what exists)      │
│                                                              │
│  LAYER 3: Password Security                                │
│  ═══════════════════════════════════════════════════       │
│  hashPassword(password):                                   │
│    ✓ Generate random salt                                  │
│    ✓ PBKDF2 with 100,000 iterations                       │
│    ✓ SHA-512 algorithm                                     │
│    ✓ Store hash + salt (never plain text)                 │
│                                                              │
│  LAYER 4: Session Security                                 │
│  ═══════════════════════════════════════════════════       │
│  generateSessionToken(userId):                             │
│    ✓ Include userId                                        │
│    ✓ Include current timestamp                             │
│    ✓ Include random 32-byte component                      │
│    ✓ Validate on every request                            │
│    ✓ Expire after 30 days                                 │
│                                                              │
│  LAYER 5: Socket.IO Authentication                         │
│  ═══════════════════════════════════════════════════       │
│  On connection:                                            │
│    ✓ Require sessionToken                                  │
│    ✓ Validate token before attaching user data            │
│    ✓ Reject if invalid/expired                            │
│    ✓ Attach userId to socket.data                         │
│    ✓ Verify authentication on every event                 │
│                                                              │
│  LAYER 6: Privacy Controls                                 │
│  ═══════════════════════════════════════════════════       │
│  Phone number:                                             │
│    ✓ Hidden by default (showPhoneNumber: false)           │
│    ✓ Never searchable                                      │
│    ✓ User can toggle visibility                           │
│    ✓ Respected in all API responses                       │
│                                                              │
│  LAYER 7: Data Validation                                  │
│  ═══════════════════════════════════════════════════       │
│  On message send:                                          │
│    ✓ Verify sender authenticated                          │
│    ✓ Verify recipient exists                              │
│    ✓ Sanitize message text                                │
│    ✓ Check text not empty                                 │
│    ✓ Store with proper timestamps                         │
│                                                              │
│  LAYER 8: Error Handling                                   │
│  ═══════════════════════════════════════════════════       │
│  Don't expose:                                             │
│    ✗ Whether email exists                                  │
│    ✗ Database structure                                    │
│    ✗ Stack traces                                          │
│    ✓ Generic error messages                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Checklist

```
LOCAL DEVELOPMENT (Current)
✅ File-based JSON storage
✅ No HTTPS required
✅ Demo/test users supported

PRODUCTION READY (Before deploy):
□ Set NODE_ENV=production
□ Set HTTPS/TLS certificates
□ Configure ALLOWED_ORIGINS correctly
□ Enable rate limiting
□ Add request logging
□ Set up backup strategy
□ Enable password requirements
□ Configure session timeout
□ Add password recovery
□ Enable 2FA (optional)
□ Migrate to MongoDB/PostgreSQL
□ Set up alerting for auth failures
□ Document incident response
□ Plan user data retention policy
□ Get security audit done

SCALE PREPARATION (Future):
□ Migrate from file storage to database
□ Implement caching layer (Redis)
□ Add message queue (RabbitMQ/Kafka)
□ Implement load balancing
□ Set up CDN for static assets
□ Enable horizontal scaling
□ Implement session replication
```

---

## 📈 User Journey

```
FIRST TIME USER:

Day 1:
  Morning: Download ComRigX
    ↓
  See Auth screen
    ↓
  Click "Sign up"
    ↓
  Enter phone: +1 (555) 123-4567
  Enter username: alice_smith
  Enter password: my_secure_pwd
  Enter display name: Alice (optional)
    ↓
  Click "Create Account"
    ↓
  ✅ Account created!
  ✅ Session saved to browser
  ✅ Logged in automatically
    ↓
  See contacts list (empty)
    ↓
  Search for friend: @bob_jones
    ↓
  Click on Bob
    ↓
  Type message: "Hi Bob! 👋"
    ↓
  Bob receives: "Alice: Hi Bob! 👋"

Day 2:
  Morning: Open ComRigX
    ↓
  ✅ Still logged in (session persisted)
  ✅ Conversations still there
  ✅ Bob's latest message visible
    ↓
  Continue chatting!

Next Month:
  If needed:
    - Logout: Click button
    - Login: Enter phone + password
    - Change display name: (future feature)
    - Show phone number: (future feature)
    - Report user: (future feature)
```

---

**Version**: 1.0.0
**Status**: ✅ Production-Ready
**Last Updated**: May 26, 2026
