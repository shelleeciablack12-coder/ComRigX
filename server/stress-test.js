// Stress test for rapid messaging - tests JSON write safety
const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3001';
const NUM_USERS = 3;
const MESSAGES_PER_USER = 30; // 90 total messages in rapid succession
const DELAY_BETWEEN_MESSAGES = 50; // 50ms between messages

let messageCount = 0;
let errorCount = 0;
const startTime = Date.now();

// Create socket connections
const sockets = [];
const usernames = ['StressTest1', 'StressTest2', 'StressTest3'];

async function runStressTest() {
  console.log('🚀 Starting rapid messaging stress test...');
  console.log(`📊 Config: ${NUM_USERS} users × ${MESSAGES_PER_USER} messages @ ${1000/DELAY_BETWEEN_MESSAGES}msg/sec`);

  // Connect users
  for (let i = 0; i < NUM_USERS; i++) {
    const socket = io(BACKEND_URL);
    sockets.push(socket);

    socket.on('connect', () => {
      console.log(`✅ User ${i+1} connected`);
      socket.emit('join', usernames[i]);
    });

    socket.on('conversationMessage', ({ message }) => {
      messageCount++;
    });

    socket.on('error', (error) => {
      errorCount++;
      console.error(`❌ Socket error (User ${i+1}):`, error);
    });
  }

  // Wait for all users to connect
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`\n📨 Sending ${NUM_USERS * MESSAGES_PER_USER} rapid messages...`);

  // Send rapid messages
  for (let round = 0; round < MESSAGES_PER_USER; round++) {
    for (let i = 0; i < NUM_USERS; i++) {
      const to = usernames[(i + 1) % NUM_USERS]; // Send to next user
      const messageText = `Rapid test message ${round + 1} from ${usernames[i]}`;
      
      sockets[i].emit('privateMessage', {
        to,
        text: messageText
      });
    }
    
    // Delay between message batches
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
  }

  console.log(`\n⏳ Waiting for messages to be processed...`);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify file integrity
  const messagesPath = path.join(__dirname, 'data', 'messages.json');
  const conversationsPath = path.join(__dirname, 'data', 'conversations.json');
  
  try {
    const messagesData = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    const conversationsData = JSON.parse(fs.readFileSync(conversationsPath, 'utf8'));
    
    console.log(`\n✅ JSON files are valid (no corruption)`);
    console.log(`   Messages saved: ${messagesData.length}`);
    console.log(`   Conversations: ${Object.keys(conversationsData).length}`);
    
    // Check for expected message count
    const expectedMinMessages = NUM_USERS * MESSAGES_PER_USER * 0.9; // Allow 10% loss
    if (messagesData.length >= expectedMinMessages) {
      console.log(`\n✅ MESSAGE INTEGRITY CHECK PASSED`);
      console.log(`   Expected: ~${NUM_USERS * MESSAGES_PER_USER}, Got: ${messagesData.length}`);
    } else {
      console.log(`\n⚠️  MESSAGE LOSS DETECTED`);
      console.log(`   Expected: ~${NUM_USERS * MESSAGES_PER_USER}, Got: ${messagesData.length}`);
    }
  } catch (error) {
    console.error(`\n❌ JSON CORRUPTION DETECTED:`, error.message);
    errorCount++;
  }

  // Results
  const duration = Date.now() - startTime;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 STRESS TEST RESULTS`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Messages sent: ${NUM_USERS * MESSAGES_PER_USER}`);
  console.log(`Messages received: ${messageCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Success rate: ${(messageCount / (NUM_USERS * MESSAGES_PER_USER) * 100).toFixed(1)}%`);
  console.log(`${'='.repeat(50)}`);

  // Cleanup
  sockets.forEach(s => s.disconnect());
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run with error handling
runStressTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
