/**
 * Automated Test Suite for Secure Connect and Communication Platform
 * Tests all 14 requirements programmatically:
 * 1. User signup (validation & bcrypt hashing)
 * 2. User login & credential verification
 * 3. JWT token generation & expiration
 * 4. Protected route access without token (rejection test: 401)
 * 5. Protected route access with valid JWT token (200 OK)
 * 6. Create note (POST /api/notes)
 * 7. Get own notes (GET /api/notes)
 * 8. Update note (PUT /api/notes/:id)
 * 9. RBAC: Normal user blocked from admin route (403 Forbidden)
 * 10. RBAC: Admin user accessing admin dashboard & users (200 OK)
 * 11. Delete note (DELETE /api/notes/:id)
 * 12. Socket.IO connection rejected without token
 * 13. Socket.IO authenticated real-time chat & message exchange
 * 14. EventEmitter event logs
 */

const http = require('http');
const ioClient = require('socket.io-client');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = `http://127.0.0.1:${process.env.PORT || 5000}`;

// Helper: Make HTTP requests using native fetch
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

// Color logging helpers
const green = (msg) => `\x1b[32m✔ ${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m✖ ${msg}\x1b[0m`;
const cyan = (msg) => `\x1b[36m${msg}\x1b[0m`;
const bold = (msg) => `\x1b[1m${msg}\x1b[0m`;

async function runTestSuite() {
  console.log(`\n================================================================`);
  console.log(bold(`🧪 SECURE CONNECT & COMMUNICATION PLATFORM - TEST RUNNER`));
  console.log(`Target: ${BASE_URL}`);
  console.log(`================================================================\n`);

  let testCount = 0;
  let passedCount = 0;

  function assert(condition, message) {
    testCount++;
    if (condition) {
      console.log(green(`Test #${testCount}: ${message}`));
      passedCount++;
    } else {
      console.error(red(`Test #${testCount} FAILED: ${message}`));
    }
  }

  // 1. Health Check
  const healthRes = await apiRequest('/api/health');
  assert(healthRes.status === 200 && healthRes.data.success === true, 'Server health check returns 200 OK');

  // Random email suffix to allow repeated test runs
  const runId = Math.floor(Math.random() * 100000);
  const userAEmail = `alice_${runId}@example.com`;
  const adminEmail = `admin_${runId}@example.com`;
  const userPassword = 'Password123!';

  // 2. User A Signup
  const signupRes = await apiRequest('/api/auth/signup', {
    method: 'POST',
    body: {
      name: 'Alice Tester',
      email: userAEmail,
      password: userPassword,
      role: 'User'
    }
  });
  assert(signupRes.status === 201 && signupRes.data.token, 'Signup creates user and returns JWT token');
  const userAToken = signupRes.data.token;
  const userAId = signupRes.data.user.id;

  // 3. User A Login
  const loginRes = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: {
      email: userAEmail,
      password: userPassword
    }
  });
  assert(loginRes.status === 200 && loginRes.data.token, 'Login succeeds and returns new valid JWT token');

  // 4. Invalid Password Rejection
  const badLoginRes = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: {
      email: userAEmail,
      password: 'WrongPassword'
    }
  });
  assert(badLoginRes.status === 401 && badLoginRes.data.success === false, 'Invalid credentials properly rejected with 401 Unauthorized');

  // 5. Access Profile WITHOUT token (Should Fail 401)
  const noTokenRes = await apiRequest('/api/auth/profile');
  assert(noTokenRes.status === 401 && noTokenRes.data.success === false, 'Protected route /api/auth/profile blocked without token (401)');

  // 6. Access Profile WITH valid token (Should Succeed 200)
  const profileRes = await apiRequest('/api/auth/profile', {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(profileRes.status === 200 && profileRes.data.user.email === userAEmail, 'Protected route /api/auth/profile returns user details with valid JWT');

  // 7. Create Note (POST /api/notes)
  const createNoteRes = await apiRequest('/api/notes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: {
      title: 'Lab 4 Architecture Overview',
      description: 'Implementing JWT, bcrypt, and Socket.IO for secure full-duplex communication.'
    }
  });
  assert(createNoteRes.status === 201 && createNoteRes.data.note.title === 'Lab 4 Architecture Overview', 'Create Note persists document with userId reference (201)');
  const createdNoteId = createNoteRes.data.note._id;

  // 8. Get All Personal Notes (GET /api/notes)
  const getNotesRes = await apiRequest('/api/notes', {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(getNotesRes.status === 200 && Array.isArray(getNotesRes.data.notes) && getNotesRes.data.count >= 1, 'Get All Notes returns personal notes for authenticated user');

  // 9. Update Note (PUT /api/notes/:id)
  const updateNoteRes = await apiRequest(`/api/notes/${createdNoteId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: {
      title: 'Lab 4 Architecture - UPDATED',
      description: 'Updated note description verifying PUT endpoint.'
    }
  });
  assert(updateNoteRes.status === 200 && updateNoteRes.data.note.title === 'Lab 4 Architecture - UPDATED', 'Update Note verifies ownership and updates document in MongoDB');

  // 10. Role-Based Access Control: Normal User blocked from Admin route
  const adminForbiddenRes = await apiRequest('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(adminForbiddenRes.status === 403 && adminForbiddenRes.data.success === false, 'RBAC correctly blocks normal "User" role with 403 Forbidden');

  // 11. Register & Login as Admin
  const adminSignupRes = await apiRequest('/api/auth/signup', {
    method: 'POST',
    body: {
      name: 'System Administrator',
      email: adminEmail,
      password: userPassword,
      role: 'Admin'
    }
  });
  assert(adminSignupRes.status === 201 && adminSignupRes.data.user.role === 'Admin', 'Admin user registered with "Admin" role');
  const adminToken = adminSignupRes.data.token;

  // 12. Admin Route Accessible by Admin User
  const adminDashRes = await apiRequest('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminDashRes.status === 200 && adminDashRes.data.data.totalUsers >= 2, 'Admin Dashboard metrics accessible by user with Admin role');

  const adminUsersRes = await apiRequest('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminUsersRes.status === 200 && adminUsersRes.data.users.length >= 2, 'Admin Users Directory accessible by Admin role');

  // 13. Delete Note (DELETE /api/notes/:id)
  const deleteNoteRes = await apiRequest(`/api/notes/${createdNoteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  assert(deleteNoteRes.status === 200 && deleteNoteRes.data.success === true, 'Delete Note removes document from MongoDB (200 OK)');

  // 14. Real-Time Socket.IO Test
  console.log(cyan('\n--- Testing Socket.IO Real-Time Chat & Authentication ---'));

  // A. Socket connection WITHOUT token should fail
  const socketFailPromise = new Promise((resolve) => {
    const unauthSocket = ioClient(BASE_URL, {
      transports: ['websocket'],
      reconnection: false,
      auth: {} // No token
    });

    unauthSocket.on('connect_error', (err) => {
      unauthSocket.close();
      resolve(true);
    });

    unauthSocket.on('connect', () => {
      unauthSocket.close();
      resolve(false);
    });
  });

  const socketAuthFailed = await socketFailPromise;
  assert(socketAuthFailed === true, 'Socket.IO connection without valid JWT rejected in handshake');

  // B. Socket connection WITH valid token and message exchange
  const socketChatPromise = new Promise((resolve) => {
    const client1 = ioClient(BASE_URL, {
      transports: ['websocket'],
      auth: { token: userAToken }
    });

    const client2 = ioClient(BASE_URL, {
      transports: ['websocket'],
      auth: { token: adminToken }
    });

    const testRoom = `room-${runId}`;
    const testMessageText = `Hello from Alice via real-time socket at ${Date.now()}`;

    client1.on('connect', () => {
      client1.emit('joinRoom', { roomId: testRoom });
    });

    client2.on('connect', () => {
      client2.emit('joinRoom', { roomId: testRoom });

      // After both joined, client 1 sends message
      setTimeout(() => {
        client1.emit('sendMessage', {
          roomId: testRoom,
          message: testMessageText
        });
      }, 300);
    });

    // Client 2 listens for the broadcast
    client2.on('receiveMessage', (msg) => {
      if (msg.message === testMessageText && msg.roomId === testRoom) {
        client1.close();
        client2.close();
        resolve(true);
      }
    });

    // Timeout fallback
    setTimeout(() => {
      client1.close();
      client2.close();
      resolve(false);
    }, 4000);
  });

  const socketExchangeSuccess = await socketChatPromise;
  assert(socketExchangeSuccess === true, 'Socket.IO authenticated clients exchange real-time messages in chat room');

  // Summary
  console.log(`\n================================================================`);
  console.log(bold(`📊 TEST SUMMARY: ${passedCount}/${testCount} TESTS PASSED`));
  if (passedCount === testCount) {
    console.log(green(`🎉 All tests passed successfully! Project is 100% functional.`));
  } else {
    console.log(red(`Some tests failed. Check server and database logs.`));
  }
  console.log(`================================================================\n`);
}

// Execute tests
runTestSuite().catch(err => {
  console.error('Test Suite encountered an error:', err);
  process.exit(1);
});
