#!/usr/bin/env node

/**
 * Agent-0 Session Management Test Script
 * 
 * Tests Redis session persistence functionality
 * Usage: node scripts/test-session.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function testCreateSession() {
  log(colors.cyan, '\n🧪 Test 1: Create Session');
  const result = await makeRequest('/api/session/create', {
    method: 'POST',
    body: JSON.stringify({
      preferences: {
        preferredResponseStyle: 'casual',
        movieGenres: ['sci-fi', 'action'],
      },
    }),
  });

  if (result.ok) {
    log(colors.green, `✓ Session created: ${result.data.session.sessionId}`);
    return result.data.session.sessionId;
  } else {
    log(colors.red, `✗ Failed to create session: ${result.data?.error || result.error}`);
    return null;
  }
}

async function testAddMessage(sessionId, role, content, type = 'text') {
  log(colors.cyan, `\n🧪 Test 2: Add ${role} message`);
  const result = await makeRequest('/api/session/message', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      role,
      content,
      type,
    }),
  });

  if (result.ok) {
    log(colors.green, `✓ Message added (total: ${result.data.messageCount})`);
    return true;
  } else {
    log(colors.red, `✗ Failed to add message: ${result.data?.error || result.error}`);
    return false;
  }
}

async function testGetSession(sessionId) {
  log(colors.cyan, '\n🧪 Test 3: Retrieve Session');
  const result = await makeRequest(`/api/session/${sessionId}`);

  if (result.ok) {
    const session = result.data.session;
    log(colors.green, `✓ Session retrieved`);
    log(colors.blue, `  Messages: ${session.messages.length}`);
    log(colors.blue, `  Created: ${new Date(session.createdAt).toLocaleString()}`);
    log(colors.blue, `  Last activity: ${new Date(session.lastActivityAt).toLocaleString()}`);
    
    if (session.messages.length > 0) {
      log(colors.yellow, '\n  Recent messages:');
      session.messages.slice(-3).forEach((msg, i) => {
        log(colors.yellow, `    ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
      });
    }
    return session;
  } else {
    log(colors.red, `✗ Failed to retrieve session: ${result.data?.error || result.error}`);
    return null;
  }
}

async function testUpdateContext(sessionId) {
  log(colors.cyan, '\n🧪 Test 4: Update Context');
  const result = await makeRequest('/api/session/context', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      context: {
        currentTopic: 'Movies about space exploration',
        lastMovieSearch: 'Interstellar',
        voiceSettings: {
          volume: 0.8,
          vadSensitivity: 0.5,
        },
      },
    }),
  });

  if (result.ok) {
    log(colors.green, '✓ Context updated');
    log(colors.blue, `  Context: ${JSON.stringify(result.data.context, null, 2)}`);
    return true;
  } else {
    log(colors.red, `✗ Failed to update context: ${result.data?.error || result.error}`);
    return false;
  }
}

async function testMessageHistory(sessionId) {
  log(colors.cyan, '\n🧪 Test 5: Add Multiple Messages (History Limiting)');
  
  for (let i = 1; i <= 25; i++) {
    await testAddMessage(
      sessionId,
      i % 2 === 0 ? 'user' : 'assistant',
      `Test message ${i}`,
      'text'
    );
  }

  const session = await testGetSession(sessionId);
  if (session && session.messages.length <= 20) {
    log(colors.green, `✓ Message limiting working (max 20, got ${session.messages.length})`);
  } else {
    log(colors.red, `✗ Message limiting failed (expected ≤20, got ${session?.messages.length})`);
  }
}

async function runTests() {
  log(colors.cyan, '\n═══════════════════════════════════════');
  log(colors.cyan, '  Agent-0 Session Management Tests');
  log(colors.cyan, '═══════════════════════════════════════\n');
  log(colors.yellow, `API Base: ${API_BASE}`);

  // Test 1: Create session
  const sessionId = await testCreateSession();
  if (!sessionId) {
    log(colors.red, '\n✗ Tests aborted: could not create session');
    return;
  }

  // Test 2: Add messages
  await testAddMessage(sessionId, 'user', 'Hello, can you help me find some sci-fi movies?', 'voice');
  await testAddMessage(sessionId, 'assistant', 'Sure! I can help you find great sci-fi movies.', 'text');

  // Test 3: Retrieve session
  await testGetSession(sessionId);

  // Test 4: Update context
  await testUpdateContext(sessionId);

  // Test 5: Message history limiting
  await testMessageHistory(sessionId);

  // Final verification
  log(colors.cyan, '\n🧪 Test 6: Final Session State');
  const finalSession = await testGetSession(sessionId);

  log(colors.cyan, '\n═══════════════════════════════════════');
  log(colors.green, '  ✓ All tests completed!');
  log(colors.cyan, '═══════════════════════════════════════\n');

  log(colors.yellow, `Session ID for manual testing: ${sessionId}`);
  log(colors.yellow, `\nTo test session persistence:`);
  log(colors.blue, `  1. Restart your browser`);
  log(colors.blue, `  2. Open dev tools and check localStorage for 'agent0_session_id'`);
  log(colors.blue, `  3. Refresh the page and verify conversation history is restored\n`);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log(colors.yellow, '\n\nTests interrupted');
  process.exit(0);
});

// Run tests
runTests()
  .then(() => {
    rl.close();
    process.exit(0);
  })
  .catch((error) => {
    log(colors.red, `\n✗ Test error: ${error.message}`);
    rl.close();
    process.exit(1);
  });
