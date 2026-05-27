const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const CONVERSATIONS_FILE = path.join(DB_DIR, 'conversations.json');
const MESSAGES_FILE = path.join(DB_DIR, 'messages.json');
const UNREAD_FILE = path.join(DB_DIR, 'unread.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log('📁 Created data directory');
}

// Initialize files if they don't exist
function initializeFiles() {
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

// Load data from files
function loadConversations() {
  try {
    return JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function loadMessages() {
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function loadUnreads() {
  try {
    return JSON.parse(fs.readFileSync(UNREAD_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// Save data to files
function saveConversations(data) {
  fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(data, null, 2));
}

function saveMessages(data) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
}

function saveUnreads(data) {
  fs.writeFileSync(UNREAD_FILE, JSON.stringify(data, null, 2));
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// Database API
const db = {
  initializeFiles,
  loadConversations,
  loadMessages,
  loadUnreads,
  loadUsers,
  saveConversations,
  saveMessages,
  saveUnreads,
  saveUsers
};

function connectDB() {
  try {
    initializeFiles();
    console.log('✅ File-based persistence initialized at:', DB_DIR);
  } catch (error) {
    console.error('❌ Persistence initialization failed:', error.message);
    process.exit(1);
  }
}

module.exports = { connectDB, db };
