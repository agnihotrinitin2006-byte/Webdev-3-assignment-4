// Client Application State
let currentUser = null;
let currentToken = localStorage.getItem('jwt_token') || null;
let currentRoom = 'general';
let socket = null;
let typingTimeout = null;

// DOM Elements
const authStatusBar = document.getElementById('authStatusBar');
const authBadge = document.getElementById('authBadge');
const activeUserName = document.getElementById('activeUserName');
const logoutBtn = document.getElementById('logoutBtn');
const jwtTokenDisplay = document.getElementById('jwtTokenDisplay');
const copyTokenBtn = document.getElementById('copyTokenBtn');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Auth Form Elements
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');

// Notes Form & List Elements
const noteForm = document.getElementById('noteForm');
const noteFormTitle = document.getElementById('noteFormTitle');
const noteEditId = document.getElementById('noteEditId');
const noteTitle = document.getElementById('noteTitle');
const noteDescription = document.getElementById('noteDescription');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const refreshNotesBtn = document.getElementById('refreshNotesBtn');
const notesContainer = document.getElementById('notesContainer');

// Chat Elements
const roomInput = document.getElementById('roomInput');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const socketDot = document.getElementById('socketDot');
const socketStatusText = document.getElementById('socketStatusText');
const currentRoomTitle = document.getElementById('currentRoomTitle');
const typingIndicator = document.getElementById('typingIndicator');
const messageCountBadge = document.getElementById('messageCountBadge');
const messagesContainer = document.getElementById('messagesContainer');
const chatForm = document.getElementById('chatForm');
const chatMessageInput = document.getElementById('chatMessageInput');

// Admin Elements
const refreshAdminBtn = document.getElementById('refreshAdminBtn');
const metricUsers = document.getElementById('metricUsers');
const metricAdmins = document.getElementById('metricAdmins');
const metricNotes = document.getElementById('metricNotes');
const metricMessages = document.getElementById('metricMessages');
const adminUsersTableBody = document.getElementById('adminUsersTableBody');

// API Tester Elements
const testHealthBtn = document.getElementById('testHealthBtn');
const testProfileBtn = document.getElementById('testProfileBtn');
const testProfileNoTokenBtn = document.getElementById('testProfileNoTokenBtn');
const testAdminNoRoleBtn = document.getElementById('testAdminNoRoleBtn');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const apiConsoleOutput = document.getElementById('apiConsoleOutput');

// Toast Notification
const toast = document.getElementById('toast');

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.borderColor = isError ? 'var(--danger)' : 'var(--primary)';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// -------------------------------------------------------------
// Tab Switching
// -------------------------------------------------------------
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');

    // Auto refresh data when tab is opened
    if (tabId === 'tab-notes' && currentToken) {
      loadNotes();
    } else if (tabId === 'tab-admin' && currentToken) {
      loadAdminData();
    }
  });
});

// -------------------------------------------------------------
// Authentication Logic
// -------------------------------------------------------------
function setAuthState(user, token) {
  currentUser = user;
  currentToken = token;

  if (token) {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));

    authBadge.textContent = `${user.role}`;
    authBadge.className = 'status-indicator online';
    activeUserName.textContent = `${user.name} (${user.email})`;
    logoutBtn.classList.remove('hidden');
    jwtTokenDisplay.value = token;

    // Connect Socket.IO automatically with JWT
    connectSocket();
  } else {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');

    authBadge.textContent = 'Logged Out';
    authBadge.className = 'status-indicator offline';
    activeUserName.textContent = 'Guest';
    logoutBtn.classList.add('hidden');
    jwtTokenDisplay.value = '';

    if (socket) {
      socket.disconnect();
    }
    notesContainer.innerHTML = '<p class="empty-state">Please log in to view and manage your secure notes.</p>';
  }
}

// Check initial stored state
try {
  const savedToken = localStorage.getItem('jwt_token');
  const savedUser = localStorage.getItem('user_data');
  if (savedToken && savedUser) {
    setAuthState(JSON.parse(savedUser), savedToken);
  }
} catch (e) {
  console.error('Failed to parse cached auth session', e);
}

// Signup Submission
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const role = document.getElementById('signupRole').value;

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    showToast(`Account created! Logged in as ${data.user.name}`);
    setAuthState(data.user, data.token);
    signupForm.reset();
    logConsole('POST /api/auth/signup (201 Created)', data);
  } catch (err) {
    showToast(err.message, true);
    logConsole('POST /api/auth/signup ERROR', { error: err.message });
  }
});

// Login Submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    showToast(`Welcome back, ${data.user.name}!`);
    setAuthState(data.user, data.token);
    loginForm.reset();
    logConsole('POST /api/auth/login (200 OK)', data);
  } catch (err) {
    showToast(err.message, true);
    logConsole('POST /api/auth/login ERROR', { error: err.message });
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  setAuthState(null, null);
  showToast('Logged out successfully.');
});

// Copy Token
copyTokenBtn.addEventListener('click', () => {
  if (jwtTokenDisplay.value) {
    navigator.clipboard.writeText(jwtTokenDisplay.value);
    showToast('JWT Token copied to clipboard!');
  }
});

// -------------------------------------------------------------
// Notes Management (CRUD)
// -------------------------------------------------------------
async function loadNotes() {
  if (!currentToken) {
    showToast('Please log in first to load notes', true);
    return;
  }

  try {
    const res = await fetch('/api/notes', {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Could not fetch notes');
    }

    renderNotes(data.notes || []);
    logConsole('GET /api/notes (200 OK)', data);
  } catch (err) {
    showToast(err.message, true);
    logConsole('GET /api/notes ERROR', { error: err.message });
  }
}

function renderNotes(notes) {
  if (!notes || notes.length === 0) {
    notesContainer.innerHTML = '<p class="empty-state">No notes found. Create your first note on the left!</p>';
    return;
  }

  notesContainer.innerHTML = notes.map(note => `
    <div class="note-item" data-id="${note._id}">
      <div class="note-item-header">
        <h4>${escapeHTML(note.title)}</h4>
        <div class="note-actions">
          <button class="btn btn-xs btn-outline edit-note-btn" data-id="${note._id}" data-title="${encodeURIComponent(note.title)}" data-desc="${encodeURIComponent(note.description)}">✏️ Edit</button>
          <button class="btn btn-xs btn-danger delete-note-btn" data-id="${note._id}">🗑️ Del</button>
        </div>
      </div>
      <p>${escapeHTML(note.description)}</p>
      <div class="note-meta">
        <span>Created: ${new Date(note.createdAt).toLocaleString()}</span>
        <span>ID: ${note._id.slice(-6)}</span>
      </div>
    </div>
  `).join('');

  // Attach Edit Handlers
  document.querySelectorAll('.edit-note-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = decodeURIComponent(btn.getAttribute('data-title'));
      const desc = decodeURIComponent(btn.getAttribute('data-desc'));

      noteEditId.value = id;
      noteTitle.value = title;
      noteDescription.value = desc;
      noteFormTitle.textContent = 'Update Note';
      saveNoteBtn.textContent = 'Update Note';
      cancelEditBtn.classList.remove('hidden');
    });
  });

  // Attach Delete Handlers
  document.querySelectorAll('.delete-note-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this note?')) {
        await deleteNote(id);
      }
    });
  });
}

// Create or Update Note Submission
noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentToken) {
    showToast('Please log in first', true);
    return;
  }

  const editId = noteEditId.value;
  const title = noteTitle.value.trim();
  const description = noteDescription.value.trim();

  try {
    const isEdit = Boolean(editId);
    const url = isEdit ? `/api/notes/${editId}` : '/api/notes';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ title, description })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Note operation failed');
    }

    showToast(isEdit ? 'Note updated successfully!' : 'Note created successfully!');
    resetNoteForm();
    loadNotes();
    logConsole(`${method} ${url} (${res.status})`, data);
  } catch (err) {
    showToast(err.message, true);
    logConsole('Note Save ERROR', { error: err.message });
  }
});

async function deleteNote(id) {
  try {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete note');
    }

    showToast('Note deleted successfully.');
    loadNotes();
    logConsole(`DELETE /api/notes/${id} (200 OK)`, data);
  } catch (err) {
    showToast(err.message, true);
    logConsole('Delete Note ERROR', { error: err.message });
  }
}

function resetNoteForm() {
  noteEditId.value = '';
  noteTitle.value = '';
  noteDescription.value = '';
  noteFormTitle.textContent = 'Create New Note';
  saveNoteBtn.textContent = 'Save Note';
  cancelEditBtn.classList.add('hidden');
}

cancelEditBtn.addEventListener('click', resetNoteForm);
refreshNotesBtn.addEventListener('click', loadNotes);

// -------------------------------------------------------------
// Real-Time Chat (Socket.IO)
// -------------------------------------------------------------
function connectSocket() {
  if (!currentToken) return;

  // Disconnect any existing socket connection
  if (socket) {
    socket.disconnect();
  }

  // Initialize Socket.IO with JWT in auth object
  socket = io({
    auth: {
      token: currentToken
    }
  });

  socket.on('connect', () => {
    socketDot.className = 'status-dot connected';
    socketStatusText.textContent = `Connected (${socket.id.slice(0, 5)}...)`;
    // Join default room
    joinRoom(roomInput.value.trim() || 'general');
  });

  socket.on('connect_error', (err) => {
    socketDot.className = 'status-dot disconnected';
    socketStatusText.textContent = `Auth Failed: ${err.message}`;
    showToast(`Socket Error: ${err.message}`, true);
  });

  socket.on('disconnect', () => {
    socketDot.className = 'status-dot disconnected';
    socketStatusText.textContent = 'Disconnected';
  });

  // Handle incoming message
  socket.on('receiveMessage', (msg) => {
    appendChatMessage(msg);
  });

  // Handle room history on join
  socket.on('roomHistory', ({ roomId, messages }) => {
    messagesContainer.innerHTML = '';
    messageCountBadge.textContent = `${messages.length} messages`;
    messages.forEach(msg => appendChatMessage(msg, false));
    scrollChatToBottom();
  });

  // Handle member joined
  socket.on('userJoined', (data) => {
    appendSystemNotice(data.message);
  });

  // Handle typing indicator
  socket.on('typing', ({ userName, isTyping }) => {
    if (isTyping) {
      typingIndicator.textContent = `✍️ ${userName} is typing...`;
    } else {
      typingIndicator.textContent = '';
    }
  });
}

function joinRoom(roomName) {
  if (!socket || !socket.connected) {
    showToast('Socket is not connected. Please log in first.', true);
    return;
  }
  currentRoom = roomName;
  currentRoomTitle.textContent = `Room: #${roomName}`;
  messagesContainer.innerHTML = '';
  socket.emit('joinRoom', { roomId: roomName });
}

joinRoomBtn.addEventListener('click', () => {
  const room = roomInput.value.trim();
  if (room) {
    joinRoom(room);
  }
});

// Chat message sending
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatMessageInput.value.trim();

  if (!text) return;
  if (!socket || !socket.connected) {
    showToast('Cannot send: Socket disconnected. Please log in.', true);
    return;
  }

  socket.emit('sendMessage', {
    roomId: currentRoom,
    message: text
  });

  chatMessageInput.value = '';

  // Clear typing indicator on send
  socket.emit('typing', { roomId: currentRoom, isTyping: false });
});

// Typing event listener
chatMessageInput.addEventListener('input', () => {
  if (!socket || !socket.connected) return;

  socket.emit('typing', { roomId: currentRoom, isTyping: true });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing', { roomId: currentRoom, isTyping: false });
  }, 1500);
});

function appendChatMessage(msg, autoScroll = true) {
  const isMine = currentUser && (msg.senderId === currentUser.id || msg.senderId === currentUser._id);
  const div = document.createElement('div');
  div.className = `chat-msg ${isMine ? 'mine' : 'theirs'}`;

  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  div.innerHTML = `
    <div class="chat-msg-header">
      <span>${escapeHTML(msg.senderName)}</span>
      <span class="chat-msg-time">${timeStr}</span>
    </div>
    <div class="chat-msg-body">${escapeHTML(msg.message)}</div>
  `;

  messagesContainer.appendChild(div);
  if (autoScroll) scrollChatToBottom();
}

function appendSystemNotice(text) {
  const div = document.createElement('div');
  div.className = 'chat-msg system';
  div.textContent = text;
  messagesContainer.appendChild(div);
  scrollChatToBottom();
}

function scrollChatToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// -------------------------------------------------------------
// Admin Dashboard
// -------------------------------------------------------------
async function loadAdminData() {
  if (!currentToken) {
    showToast('Please login as Admin to view admin metrics', true);
    return;
  }

  try {
    // 1. Fetch Metrics
    const statsRes = await fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const statsData = await statsRes.json();

    if (!statsRes.ok) {
      throw new Error(statsData.message || 'Admin authorization failed');
    }

    metricUsers.textContent = statsData.data.totalUsers;
    metricAdmins.textContent = statsData.data.totalAdmins;
    metricNotes.textContent = statsData.data.totalNotes;
    metricMessages.textContent = statsData.data.totalMessages;

    // 2. Fetch Users Directory
    const usersRes = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const usersData = await usersRes.json();

    if (usersRes.ok && usersData.users) {
      adminUsersTableBody.innerHTML = usersData.users.map(u => `
        <tr>
          <td><code>${u._id.slice(-6)}</code></td>
          <td><strong>${escapeHTML(u.name)}</strong></td>
          <td>${escapeHTML(u.email)}</td>
          <td><span class="tag">${u.role}</span></td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        </tr>
      `).join('');
    }

    logConsole('GET /api/admin/dashboard (200 OK)', statsData);
  } catch (err) {
    showToast(err.message, true);
    adminUsersTableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--danger);">${err.message}</td></tr>`;
    logConsole('Admin Dashboard ERROR', { error: err.message });
  }
}

refreshAdminBtn.addEventListener('click', loadAdminData);

// -------------------------------------------------------------
// Quick API Response Inspector
// -------------------------------------------------------------
function logConsole(title, data) {
  const timestamp = new Date().toLocaleTimeString();
  const formatted = `[${timestamp}] === ${title} ===\n${JSON.stringify(data, null, 2)}\n\n`;
  apiConsoleOutput.textContent = formatted + apiConsoleOutput.textContent;
}

clearConsoleBtn.addEventListener('click', () => {
  apiConsoleOutput.textContent = '// Output cleared.\n';
});

testHealthBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    logConsole('GET /api/health (200 OK)', data);
  } catch (err) {
    logConsole('GET /api/health ERROR', { error: err.message });
  }
});

testProfileBtn.addEventListener('click', async () => {
  if (!currentToken) {
    showToast('Log in first to test profile with valid JWT', true);
    return;
  }
  try {
    const res = await fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    logConsole(`GET /api/auth/profile (${res.status})`, data);
    showToast(`Profile call status: ${res.status}`);
  } catch (err) {
    logConsole('GET /api/auth/profile ERROR', { error: err.message });
  }
});

testProfileNoTokenBtn.addEventListener('click', async () => {
  try {
    // Intentionally sending request WITHOUT Authorization header
    const res = await fetch('/api/auth/profile');
    const data = await res.json();
    logConsole(`GET /api/auth/profile WITHOUT TOKEN (${res.status} Expected 401)`, data);
    showToast(`Expected rejection: Status ${res.status} Unauthorized`, true);
  } catch (err) {
    logConsole('GET /api/auth/profile NO-TOKEN ERROR', { error: err.message });
  }
});

testAdminNoRoleBtn.addEventListener('click', async () => {
  if (!currentToken) {
    showToast('Please log in as a normal user first to test role restriction', true);
    return;
  }
  try {
    const res = await fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    logConsole(`GET /api/admin/dashboard (${res.status})`, data);
    if (res.status === 403) {
      showToast('RBAC Verified: 403 Forbidden for non-admin!', true);
    } else {
      showToast(`Admin response: Status ${res.status}`);
    }
  } catch (err) {
    logConsole('GET /api/admin/dashboard ERROR', { error: err.message });
  }
});

// Helper: Escape HTML strings to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
