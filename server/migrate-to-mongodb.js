// Migration script: JSON to MongoDB
// Run this once to migrate your existing data to MongoDB

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const { User, Message, Conversation, Unread, connectDB } = require('./database');

async function migrateToMongoDB() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('🔄 Starting migration from JSON to MongoDB...');

    // 1. Migrate Users
    console.log('\n📝 Migrating users...');
    const usersPath = path.join(__dirname, 'data', 'users.json');
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      
      for (const [userId, userData] of Object.entries(usersData)) {
        const existingUser = await User.findOne({ userId });
        if (!existingUser) {
          await User.create({
            userId: userData.userId,
            phoneNumber: userData.phoneNumber,
            passwordHash: userData.passwordHash,
            passwordSalt: userData.passwordSalt,
            username: userData.username,
            displayName: userData.displayName,
            showPhoneNumber: userData.showPhoneNumber || false,
            sessionToken: userData.sessionToken,
            sessionCreated: userData.sessionCreated,
            lastSeen: userData.lastSeen,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
          });
          console.log(`  ✅ Migrated user: ${userData.username} (${userId})`);
        }
      }
    }

    // 2. Migrate Messages
    console.log('\n💬 Migrating messages...');
    const messagesPath = path.join(__dirname, 'data', 'messages.json');
    if (fs.existsSync(messagesPath)) {
      const messagesData = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
      
      for (const messageData of messagesData) {
        const existingMessage = await Message.findOne({ id: messageData.id });
        if (!existingMessage) {
          await Message.create({
            id: messageData.id,
            from: messageData.from,
            to: messageData.to,
            fromUsername: messageData.fromUsername,
            fromDisplayName: messageData.fromDisplayName,
            text: messageData.text,
            conversationId: messageData.conversationId,
            timestamp: messageData.timestamp,
            isRead: messageData.isRead || false
          });
        }
      }
      console.log(`  ✅ Migrated ${messagesData.length} messages`);
    }

    // 3. Migrate Conversations
    console.log('\n🗣️ Migrating conversations...');
    const conversationsPath = path.join(__dirname, 'data', 'conversations.json');
    if (fs.existsSync(conversationsPath)) {
      const conversationsData = JSON.parse(fs.readFileSync(conversationsPath, 'utf-8'));
      
      for (const [convId, convData] of Object.entries(conversationsData)) {
        const existingConv = await Conversation.findOne({ conversationId: convId });
        if (!existingConv) {
          const [userId1, userId2] = convId.split('--');
          await Conversation.create({
            conversationId: convId,
            userId1,
            userId2,
            lastMessage: convData.lastMessage,
            lastMessageTime: convData.lastMessageTime,
            unreadCount1: convData.unreadCount1 || 0,
            unreadCount2: convData.unreadCount2 || 0,
            createdAt: convData.createdAt,
            updatedAt: convData.updatedAt
          });
        }
      }
      console.log(`  ✅ Migrated ${Object.keys(conversationsData).length} conversations`);
    }

    // 4. Migrate Unread Counts
    console.log('\n📬 Migrating unread counts...');
    const unreadPath = path.join(__dirname, 'data', 'unread.json');
    if (fs.existsSync(unreadPath)) {
      const unreadData = JSON.parse(fs.readFileSync(unreadPath, 'utf-8'));
      
      for (const [userId, convCounts] of Object.entries(unreadData)) {
        for (const [conversationId, count] of Object.entries(convCounts)) {
          const existingUnread = await Unread.findOne({ userId, conversationId });
          if (!existingUnread) {
            await Unread.create({
              userId,
              conversationId,
              count
            });
          }
        }
      }
      console.log(`  ✅ Migrated unread counts`);
    }

    // Summary
    const userCount = await User.countDocuments();
    const messageCount = await Message.countDocuments();
    const convCount = await Conversation.countDocuments();

    console.log('\n✅ Migration Complete!');
    console.log(`\nDatabase Summary:`);
    console.log(`  Users: ${userCount}`);
    console.log(`  Messages: ${messageCount}`);
    console.log(`  Conversations: ${convCount}`);
    console.log('\n💡 Next step: Delete server/data/ folder to clean up old JSON files');
    console.log('💡 Then restart your server with: npm start');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateToMongoDB();
