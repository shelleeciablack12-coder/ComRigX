// Reconnection stability test - ensures no duplicate connections or user duplication
const { io } = require('socket.io-client');

const BACKEND_URL = 'http://localhost:3001';
const TEST_USERNAME = 'ReconnectTest';
let connectionAttempts = 0;
let duplicateDetected = false;

async function testReconnection() {
  console.log('🔄 Testing Socket.IO reconnection stability...\n');

  const socket = io(BACKEND_URL, {
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 2000,
    reconnectionAttempts: 5
  });

  let userListSnapshots = [];

  socket.on('connect', () => {
    connectionAttempts++;
    console.log(`📡 Connect #${connectionAttempts} - Socket ID: ${socket.id}`);
    socket.emit('join', TEST_USERNAME);
  });

  socket.on('userList', (userList) => {
    const count = userList.filter(u => u === TEST_USERNAME).length;
    userListSnapshots.push({ attempt: connectionAttempts, count, userList });
    
    if (count > 1) {
      duplicateDetected = true;
      console.log(`⚠️  DUPLICATE DETECTED! ${count} instances of "${TEST_USERNAME}" in user list`);
      console.log(`    User list:`, userList);
    } else {
      console.log(`✅ User list OK (${TEST_USERNAME} count: ${count})`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`📴 Disconnected: ${reason}`);
  });

  socket.on('connect_error', (error) => {
    console.log(`❌ Connection error: ${error.message}`);
  });

  // Simulate rapid connect/disconnect cycles
  console.log('\n⚡ Simulating 3 disconnect/reconnect cycles...\n');

  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`\n🔌 Disconnect cycle #${i + 1}`);
    socket.disconnect();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`🔌 Reconnecting...`);
    socket.connect();
  }

  // Final wait
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Results
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔄 RECONNECTION TEST RESULTS`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Connection attempts: ${connectionAttempts}`);
  console.log(`Duplicate connections detected: ${duplicateDetected ? 'YES ❌' : 'NO ✅'}`);
  console.log(`User list snapshots: ${userListSnapshots.length}`);
  
  userListSnapshots.forEach(snap => {
    console.log(`  Attempt ${snap.attempt}: ${snap.count}x "${TEST_USERNAME}"`);
  });

  console.log(`\n${duplicateDetected ? '❌ FAILED' : '✅ PASSED'}`);
  console.log(`${'='.repeat(50)}`);

  socket.disconnect();
  process.exit(duplicateDetected ? 1 : 0);
}

testReconnection().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
