// MongoDB Database Configuration
const mongoose = require('mongoose');

// MongoDB Connection
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/comrigx';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected:', mongoUri.split('@')[1] || mongoUri.substring(0, 30) + '...');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    description: '12-digit numeric ID'
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  passwordSalt: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true
  },
  showPhoneNumber: {
    type: Boolean,
    default: false
  },
  sessionToken: String,
  sessionCreated: Date,
  lastSeen: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    index: true
  },
  from: {
    type: String,
    required: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    index: true
  },
  fromUsername: String,
  fromDisplayName: String,
  text: {
    type: String,
    required: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId1: {
    type: String,
    required: true,
    index: true
  },
  userId2: {
    type: String,
    required: true,
    index: true
  },
  lastMessage: String,
  lastMessageTime: Date,
  unreadCount1: {
    type: Number,
    default: 0
  },
  unreadCount2: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Unread Schema
const unreadSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  count: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Unread = mongoose.model('Unread', unreadSchema);

module.exports = {
  connectDB,
  User,
  Message,
  Conversation,
  Unread
};
