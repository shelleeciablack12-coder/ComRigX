// Entry point for the Node.js + Express + Socket.IO server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { connectDB, getDB } = require('./db-hybrid');
const authRoutes = require('./routes/auth');
const { router: usersRouter } = require('./routes/users');
const { validateSessionToken } = require('./auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

// Middleware to attach db to all routes
app.use((req, res, next) => {
  req.db = getDB();
  next();
});

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Connect to database (hybrid: MongoDB or file-based)
async function startServer() {
  await connectDB();

  console.log(`🚀 Starting server in ${NODE_ENV} mode on port ${PORT}`);

  // Register API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRouter);

// Track online users by userId: { userId: { username, socketId, displayName } }
const onlineUsers = {};
// Track typing users: { [conversationId]: [userId] }
const typingUsers = {};

// Helper function to generate a stable conversation ID from two user IDs
function getConversationId(userId1, userId2) {
  return [userId1, userId2].sort().join('--');
}

// Broadcast updated user list
function broadcastUserList() {
  const userList = Object.values(onlineUsers).map(u => ({
    userId: u.userId,
    username: u.username,
    displayName: u.displayName
  }));
  io.emit('userList', userList);
}

// Socket.IO connection handling with authentication
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  /**
   * User joins after authentication
   * Expects: { sessionToken }
   */
  socket.on('authenticate', (data) => {
    const sessionToken = data?.sessionToken;
    const db = getDB();
    
    if (!sessionToken) {
      console.log('❌ Connection attempt without session token');
      socket.emit('authError', { error: 'Session token required' });
      return;
    }

    const tokenData = validateSessionToken(sessionToken);
    if (!tokenData) {
      console.log('❌ Invalid session token');
      socket.emit('authError', { error: 'Invalid or expired session token' });
      return;
    }

    const users = db.loadUsers();
    const user = users[tokenData.userId];

    if (!user) {
      console.log('❌ User not found for token');
      socket.emit('authError', { error: 'User not found' });
      return;
    }

    // Store user data in socket
    socket.data.userId = user.userId;
    socket.data.username = user.username;
    socket.data.displayName = user.displayName;

    // Register as online
    onlineUsers[user.userId] = {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      socketId: socket.id
    };

    console.log(`✅ User authenticated: ${user.username} (${user.userId})`);
    socket.emit('authSuccess', {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName
    });

    // Update user last seen
    user.lastSeen = new Date().toISOString();
    users[user.userId] = user;
    db.saveUsers(users);

    // Broadcast updated user list
    broadcastUserList();
  });

  /**
   * Get list of online users
   */
  socket.on('getUsers', () => {
    const db = getDB();
    if (!socket.data.userId) {
      socket.emit('error', { error: 'Not authenticated' });
      return;
    }

    const userList = Object.values(onlineUsers)
      .filter(u => u.userId !== socket.data.userId) // Exclude self
      .map(u => ({
        userId: u.userId,
        username: u.username,
        displayName: u.displayName
      }));

    socket.emit('userList', userList);
  });

  /**
   * Send private message
   */
  socket.on('privateMessage', async ({ toUserId, text }) => {
    const fromUserId = socket.data.userId;
    const trimmedText = text?.trim();
    const db = getDB();

    if (!fromUserId || !toUserId || !trimmedText) {
      return;
    }

    const conversationId = getConversationId(fromUserId, toUserId);
    const users = db.loadUsers();
    const fromUser = users[fromUserId];
    const toUser = users[toUserId];

    if (!toUser) {
      socket.emit('error', { error: 'Recipient user not found' });
      return;
    }

    // Get or create conversation
    const conversations = db.loadConversations();
    if (!conversations[conversationId]) {
      conversations[conversationId] = {
        conversationId,
        participants: [fromUserId, toUserId].sort(),
        lastMessage: trimmedText,
        lastMessageTime: new Date().toISOString(),
        lastMessageFrom: fromUserId
      };
    } else {
      conversations[conversationId].lastMessage = trimmedText;
      conversations[conversationId].lastMessageTime = new Date().toISOString();
      conversations[conversationId].lastMessageFrom = fromUserId;
    }
    db.saveConversations(conversations);

    // Save message
    const messages = db.loadMessages();
    const message = {
      id: `${conversationId}-${Date.now()}`,
      from: fromUserId,
      to: toUserId,
      fromUsername: fromUser.username,
      fromDisplayName: fromUser.displayName,
      text: trimmedText,
      conversationId,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    messages.push(message);
    db.saveMessages(messages);

    // Increment unread count for recipient
    const unreads = db.loadUnreads();
    const key = `${toUserId}--${conversationId}`;
    unreads[key] = (unreads[key] || 0) + 1;
    db.saveUnreads(unreads);

    socket.join(conversationId);

    // Emit to sender
    socket.emit('conversationMessage', {
      conversation: conversations[conversationId],
      message
    });

    // Emit to recipient if online
    if (onlineUsers[toUserId]) {
      const recipientSocket = io.to(onlineUsers[toUserId].socketId);
      recipientSocket.emit('conversationMessage', {
        conversation: conversations[conversationId],
        message
      });
      console.log(`📨 Message ${conversationId}: delivered`);
    } else {
      console.log(`📨 Message ${conversationId}: recipient offline (saved)`);
    }
  });

  /**
   * Select/open a conversation
   */
  socket.on('selectChat', async (toUserId) => {
    const fromUserId = socket.data.userId;
    const db = getDB();

    if (!fromUserId || !toUserId) {
      return;
    }

    const conversationId = getConversationId(fromUserId, toUserId);

    try {
      // Get or create conversation
      const conversations = db.loadConversations();
      if (!conversations[conversationId]) {
        conversations[conversationId] = {
          conversationId,
          participants: [fromUserId, toUserId].sort()
        };
        db.saveConversations(conversations);
      }

      // Load all messages for this conversation
      const allMessages = db.loadMessages();
      const conversationMessages = allMessages
        .filter(msg => msg.conversationId === conversationId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Clear unread count
      const unreads = db.loadUnreads();
      const key = `${fromUserId}--${conversationId}`;
      unreads[key] = 0;
      db.saveUnreads(unreads);

      socket.join(conversationId);
      socket.emit('conversationSelected', {
        conversationId,
        participants: conversations[conversationId].participants,
        messages: conversationMessages
      });
      console.log(`👁️  ${socket.data.username} opened conversation ${conversationId}`);
    } catch (error) {
      console.error('Error in selectChat:', error);
      socket.emit('error', { error: 'Failed to load conversation' });
    }
  });

  /**
   * Typing indicator
   */
  socket.on('typing', ({ toUserId }) => {
    const fromUserId = socket.data.userId;

    if (!fromUserId || !toUserId) {
      return;
    }

    const conversationId = getConversationId(fromUserId, toUserId);

    // Initialize typing users for this conversation if needed
    if (!typingUsers[conversationId]) {
      typingUsers[conversationId] = {};
    }

    // Clear existing timeout for this user
    if (typingUsers[conversationId][fromUserId]) {
      clearTimeout(typingUsers[conversationId][fromUserId]);
    }

    // Set new timeout (2 second inactivity)
    const timeoutId = setTimeout(() => {
      if (typingUsers[conversationId]) {
        delete typingUsers[conversationId][fromUserId];
        // Notify recipient
        if (onlineUsers[toUserId]) {
          io.to(onlineUsers[toUserId].socketId).emit('userTyping', {
            conversationId,
            typingUsers: Object.keys(typingUsers[conversationId] || {})
          });
        }
      }
    }, 2000);

    typingUsers[conversationId][fromUserId] = timeoutId;

    // Notify recipient that someone is typing
    if (onlineUsers[toUserId]) {
      io.to(onlineUsers[toUserId].socketId).emit('userTyping', {
        conversationId,
        typingUsernames: [socket.data.username]
      });
    }
  });

  /**
   * Disconnect handler
   */
  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    const db = getDB();

    if (userId && onlineUsers[userId]) {
      const username = onlineUsers[userId].username;

      // Update last seen in database
      const users = db.loadUsers();
      if (users[userId]) {
        users[userId].lastSeen = new Date().toISOString();
        db.saveUsers(users);
      }

      // Clear typing sessions
      for (const conversationId in typingUsers) {
        if (typingUsers[conversationId][userId]) {
          clearTimeout(typingUsers[conversationId][userId]);
          delete typingUsers[conversationId][userId];
        }
      }

      delete onlineUsers[userId];
      console.log(`🔌 User disconnected: ${username} (${userId})`);
      broadcastUserList();
    }
  });
});

  // Start listening
  server.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// REST API Endpoints for fetching initial data

/**
 * GET /api/conversations/:userId
 * Get all conversations for a user with unread counts
 */
app.get('/api/conversations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDB();

    const conversations = db.loadConversations();
    const unreads = db.loadUnreads();
    const users = db.loadUsers();

    const userConversations = Object.values(conversations)
      .filter(conv => conv.participants.includes(userId))
      .map(conv => {
        // Get info about the other participant
        const otherUserId = conv.participants.find(id => id !== userId);
        const otherUser = users[otherUserId];

        return {
          conversationId: conv.conversationId,
          participants: conv.participants,
          otherUser: otherUser ? {
            userId: otherUser.userId,
            username: otherUser.username,
            displayName: otherUser.displayName
          } : null,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          lastMessageFrom: conv.lastMessageFrom,
          unreadCount: unreads[`${userId}--${conv.conversationId}`] || 0
        };
      })
      .sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));

    res.json(userConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/unread/:userId
 * Get unread counts for a user
 */
app.get('/api/unread/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const unreads = db.loadUnreads();
    const counts = {};

    Object.keys(unreads).forEach(key => {
      if (key.startsWith(userId + '--')) {
        const conversationId = key.substring((userId + '--').length);
        counts[conversationId] = unreads[key];
      }
    });

    res.json(counts);
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ error: error.message });
  }
});
