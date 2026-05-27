// Hybrid Database Layer - Supports both File-Based (dev) and MongoDB (production)
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DB_DIR = path.join(__dirname, 'data');
const CONVERSATIONS_FILE = path.join(DB_DIR, 'conversations.json');
const MESSAGES_FILE = path.join(DB_DIR, 'messages.json');
const UNREAD_FILE = path.join(DB_DIR, 'unread.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');

let db = null;
let useMongoose = false;
let User, Message, Conversation, Unread;

// ==================== File-Based Backend (Development) ====================
class FileBasedDB {
  constructor() {
    this.initializeFiles();
    this.conversations = this.loadConversations();
    this.messages = this.loadMessages();
    this.unread = this.loadUnreads();
    this.users = this.loadUsers();
  }

  initializeFiles() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONVERSATIONS_FILE)) {
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(UNREAD_FILE)) {
      fs.writeFileSync(UNREAD_FILE, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
    }
  }

  loadConversations() {
    try {
      return JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, 'utf8'));
    } catch {
      return {};
    }
  }

  loadMessages() {
    try {
      return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    } catch {
      return [];
    }
  }

  loadUnreads() {
    try {
      return JSON.parse(fs.readFileSync(UNREAD_FILE, 'utf8'));
    } catch {
      return {};
    }
  }

  loadUsers() {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
      return {};
    }
  }

  saveConversations() {
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(this.conversations, null, 2));
  }

  saveMessages() {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(this.messages, null, 2));
  }

  saveUnreads() {
    fs.writeFileSync(UNREAD_FILE, JSON.stringify(this.unread, null, 2));
  }

  saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
  }
}

// ==================== MongoDB Backend (Production) ====================
async function setupMongoose() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/comrigx';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected');

    // Define Schemas
    const userSchema = new mongoose.Schema({
      userId: { type: String, required: true, unique: true, index: true },
      phoneNumber: { type: String, required: true, unique: true, index: true },
      passwordHash: { type: String, required: true },
      passwordSalt: { type: String, required: true },
      username: { type: String, required: true, unique: true, index: true },
      displayName: { type: String, required: true },
      showPhoneNumber: { type: Boolean, default: false },
      sessionToken: String,
      sessionCreated: Date,
      lastSeen: Date,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const messageSchema = new mongoose.Schema({
      id: { type: String, unique: true, index: true },
      from: { type: String, required: true, index: true },
      to: { type: String, required: true, index: true },
      fromUsername: String,
      fromDisplayName: String,
      text: { type: String, required: true },
      conversationId: { type: String, required: true, index: true },
      timestamp: { type: Date, default: Date.now, index: true },
      isRead: { type: Boolean, default: false }
    });

    const conversationSchema = new mongoose.Schema({
      conversationId: { type: String, required: true, unique: true, index: true },
      userId1: { type: String, required: true, index: true },
      userId2: { type: String, required: true, index: true },
      lastMessage: String,
      lastMessageTime: Date,
      unreadCount1: { type: Number, default: 0 },
      unreadCount2: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const unreadSchema = new mongoose.Schema({
      userId: { type: String, required: true, index: true },
      conversationId: { type: String, required: true, index: true },
      count: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now }
    });

    User = mongoose.model('User', userSchema);
    Message = mongoose.model('Message', messageSchema);
    Conversation = mongoose.model('Conversation', conversationSchema);
    Unread = mongoose.model('Unread', unreadSchema);

    return { User, Message, Conversation, Unread };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Falling back to file-based persistence');
    return null;
  }
}

// ==================== Main Connection Logic ====================
async function connectDB() {
  if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb://localhost:27017/comrigx') {
    // Try MongoDB first (production)
    console.log('🔄 Attempting MongoDB connection...');
    const result = await setupMongoose();
    if (result) {
      useMongoose = true;
      console.log('✅ Using MongoDB for persistence');
      return result;
    }
  }

  // Fall back to file-based (development)
  console.log('📁 Using file-based persistence');
  db = new FileBasedDB();
  console.log('✅ File-based persistence initialized');
  return db;
}

module.exports = {
  connectDB,
  getDB: () => db,
  useMongoose: () => useMongoose,
  getModels: () => ({ User, Message, Conversation, Unread })
};
