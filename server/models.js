const mongoose = require('mongoose');

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    from: { type: String, required: true }, // Can be userId or username
    to: { type: String, required: true }, // Can be userId or username
    text: { type: String, required: true },
    conversationId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

// Conversation Schema
const conversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true },
    participants: { type: [String], required: true }, // User IDs
    lastMessage: String,
    lastMessageTime: Date,
    lastMessageFrom: String, // User ID
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

/**
 * Enhanced User Schema with authentication and identity separation
 * 
 * PRIVATE IDENTITY:
 * - phoneNumber: Used only for signup, login, password recovery, and security
 * - passwordHash & passwordSalt: For secure authentication
 * - showPhoneNumber: Privacy setting to hide phone from other users
 * 
 * PUBLIC IDENTITY:
 * - userId: Permanent 12-digit unique ID (e.g., 20260526ABCD)
 * - username: Unique, searchable, used for display (3-30 chars)
 * - displayName: Editable, appears in chats/profiles (not required to be unique)
 * 
 * SESSION:
 * - sessionToken: Active session token for persistence
 * - sessionCreated: When the current session was created
 */
const userSchema = new mongoose.Schema(
  {
    // Private Identity (Login & Security)
    phoneNumber: { type: String, required: true, unique: true }, // Normalized, hashed separately
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    showPhoneNumber: { type: Boolean, default: false }, // Privacy setting

    // Public Identity
    userId: { type: String, required: true, unique: true }, // 12-digit ID like 20260526ABCD
    username: { type: String, required: true, unique: true }, // Searchable, 3-30 chars
    displayName: { type: String, default: '' }, // Editable, appears in chats
    
    // Session Management
    sessionToken: { type: String, default: null }, // Active session token
    sessionCreated: { type: Date, default: null }, // Session creation time
    
    // Account Metadata
    lastSeen: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

// Unread Status Schema (tracks read status for messages)
const unreadStatusSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // 12-digit user ID
    conversationId: { type: String, required: true },
    unreadCount: { type: Number, default: 0 }
  }
);

const UnreadStatus = mongoose.model('UnreadStatus', unreadStatusSchema);

module.exports = { Message, Conversation, User, UnreadStatus };
