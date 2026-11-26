# Secure Connect and Communication Platform
### Web Development III – Unit 4 Lab Assignment

---

## 1. Project Overview

The **Secure Connect and Communication Platform** is a full-stack, enterprise-grade, secure server-side application engineered using **Node.js, Express.js, MongoDB, JWT (JSON Web Tokens), bcrypt, Socket.IO, and Node.js EventEmitter**.

### Key Capabilities:
- **Authentication System**: Secure user signup and login with manual bcrypt password hashing and salting.
- **Stateless JWT Authorization**: Bearer token authentication for route security.
- **Role-Based Access Control (RBAC)**: Fine-grained authorization separating `User` and `Admin` permissions.
- **Secure Personal Notes Management (CRUD)**: Create, Read, Update, and Delete notes with database-level user ownership isolation.
- **Real-Time Duplex Chat (Socket.IO)**: Real-time messaging, multi-room support, typing indicators, and room history with JWT handshake authentication.
- **Event-Driven Architecture (EventEmitter)**: Decoupled application activity logging for user registrations, logins, notes management, and chat broadcasts.
- **Built-in Interactive Web UI**: Fully responsive browser interface for direct lab demonstrations and college submission screenshots.

---

## 2. Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js** | Server-side JavaScript runtime environment |
| **Express.js** | Backend REST API framework & HTTP middleware |
| **MongoDB** | NoSQL document database for users, notes, and messages |
| **Mongoose** | Object Data Modeling (ODM), schemas, indexes, and validation |
| **bcryptjs** | Password salting (10 rounds) and hash verification |
| **jsonwebtoken (JWT)** | Signed token generation, payload decoding, and expiration enforcement |
| **Socket.IO** | Real-time bidirectional WebSocket communication with JWT auth |
| **Node.js EventEmitter** | Decoupled event logging for auditing application events |
| **dotenv** | Environment configuration management (`.env`) |
| **CORS** | Cross-Origin Resource Sharing enablement |

---

## 3. Project Directory Structure

```
c:\webdev3\Web development Assignment 4\
│
├── package.json                        # Root workspace npm configuration
├── README.md                           # Complete lab documentation & setup guide
│
└── backend/
    ├── config/
    │   └── db.js                       # Mongoose MongoDB connection module
    │
    ├── controllers/
    │   ├── authController.js           # Signup, login, profile logic & event emission
    │   ├── noteController.js           # Personal Notes CRUD with ownership checks
    │   └── adminController.js          # Admin-only metrics and user directory
    │
    ├── middleware/
    │   ├── authMiddleware.js           # Bearer JWT verification & req.user attachment
    │   ├── roleMiddleware.js           # RBAC middleware (Admin vs User restriction)
    │   └── errorMiddleware.js          # Central error handler (CastError, DuplicateKey, 404)
    │
    ├── models/
    │   ├── User.js                     # User schema, bcrypt pre-save hook & matchPassword method
    │   ├── Note.js                     # Note schema with userId ObjectId reference & compound index
    │   └── Message.js                  # Chat message schema with roomId index & timestamps
    │
    ├── routes/
    │   ├── authRoutes.js               # POST /signup, POST /login, GET /profile
    │   ├── noteRoutes.js               # POST, GET, PUT, DELETE /api/notes
    │   └── adminRoutes.js              # GET /api/admin/users, GET /api/admin/dashboard
    │
    ├── sockets/
    │   └── chatSocket.js               # Socket.IO JWT handshake auth & chat room events
    │
    ├── events/
    │   └── eventEmitter.js             # Custom AppEventEmitter & styled console event listeners
    │
    ├── utils/
    │   └── generateToken.js            # JWT signing helper utility
    │
    ├── public/                         # Built-in Interactive Web Client (Served by Express)
    │   ├── index.html                  # Tabbed UI for Auth, Notes CRUD, Socket Chat & Admin
    │   ├── style.css                   # Modern dark-mode responsive design
    │   └── app.js                      # Client-side API fetch, Socket.IO client & state handling
    │
    ├── data/
    │   └── db/                         # Local MongoDB storage directory
    │
    ├── test-suite.js                   # Automated 16-test suite testing all assignment requirements
    ├── run-all-tests.js                # One-command runner: starts mongod, server, and test-suite
    ├── .env                            # Environment secrets (PORT, MONGO_URI, JWT_SECRET)
    ├── .env.example                    # Environment secrets template
    ├── .gitignore                      # Git ignore rules for node_modules and .env
    ├── package.json                    # Backend dependencies & npm scripts
    └── server.js                       # Server entry point combining Express, HTTP & Socket.IO
```

---

## 4. The 20 Architectural Connections Explained

Every component in this platform is tightly coupled through clean, standard architectural patterns:

| # | Connected Components | File References | How Data Travels |
| :--- | :--- | :--- | :--- |
| **1** | **Node.js Server ↔ Express** | `server.js` | `const app = express(); const server = http.createServer(app);` Express acts as the request listener for Node's native HTTP server. |
| **2** | **Express Server ↔ MongoDB** | `server.js` ↔ `config/db.js` | `connectDB()` is called before server listen. Mongoose establishes connection using `process.env.MONGO_URI`. |
| **3** | **MongoDB ↔ Mongoose Models** | `config/db.js` ↔ `models/*.js` | Mongoose ODM compiles schemas (`User`, `Note`, `Message`) into native MongoDB collections (`users`, `notes`, `messages`). |
| **4** | **Signup Route ↔ Auth Controller** | `routes/authRoutes.js` ↔ `controllers/authController.js` | `router.post('/signup', registerUser);` passes `req.body` (name, email, password, role) to the controller. |
| **5** | **Login Route ↔ Auth Controller** | `routes/authRoutes.js` ↔ `controllers/authController.js` | `router.post('/login', loginUser);` passes login credentials to controller. |
| **6** | **Auth Controller ↔ User Model** | `controllers/authController.js` ↔ `models/User.js` | `User.findOne()` queries database; `User.create()` triggers validation and Mongoose pre-save hook. |
| **7** | **bcrypt ↔ Password Hashing & Verification** | `models/User.js` | `userSchema.pre('save')` hashes raw password with `bcrypt.genSalt(10)` and `bcrypt.hash()`. `matchPassword()` uses `bcrypt.compare()`. |
| **8** | **JWT Generation ↔ Login Response** | `controllers/authController.js` ↔ `utils/generateToken.js` | After bcrypt matches, `generateToken(user._id, user.role, user.email)` signs JWT and returns it in the JSON body. |
| **9** | **JWT Token ↔ Auth Middleware** | `middleware/authMiddleware.js` ↔ Incoming Requests | `protect` reads `req.headers.authorization`, strips `Bearer `, and validates signature via `jwt.verify(token, JWT_SECRET)`. |
| **10** | **Auth Middleware ↔ Protected Routes** | `routes/noteRoutes.js` ↔ `middleware/authMiddleware.js` | `router.use(protect)` ensures only requests with valid JWTs proceed; attaches authenticated `req.user`. |
| **11** | **Role Middleware ↔ Admin Routes** | `routes/adminRoutes.js` ↔ `middleware/roleMiddleware.js` | `authorizeRoles('Admin')` checks `req.user.role`. Returns 403 Forbidden if the user is not an Admin. |
| **12** | **Notes Routes ↔ Notes Controller** | `routes/noteRoutes.js` ↔ `controllers/noteController.js` | Routes delegate POST, GET, PUT, DELETE requests to matching controller functions. |
| **13** | **Notes Controller ↔ Notes Model** | `controllers/noteController.js` ↔ `models/Note.js` | Controller executes `Note.find({ userId: req.user._id })`, `Note.create()`, `note.save()`, and `note.deleteOne()`. |
| **14** | **Notes ↔ User Relationship** | `models/Note.js` ↔ `models/User.js` | Note schema defines `userId: { type: Schema.Types.ObjectId, ref: 'User' }`, linking notes strictly to their creator. |
| **15** | **Socket.IO ↔ HTTP Server** | `server.js` ↔ `sockets/chatSocket.js` | `const io = new Server(server, { cors: ... })` attaches real-time WebSocket protocol directly to Node's HTTP server. |
| **16** | **Socket.IO ↔ JWT Authentication** | `sockets/chatSocket.js` | `io.use(async (socket, next) => ...)` extracts token from `socket.handshake.auth.token`, verifies via `jwt.verify()`, rejecting unauthorized connections before connection handshake completes. |
| **17** | **Socket.IO ↔ Real-Time Chat Events** | `sockets/chatSocket.js` ↔ Frontend | Events `joinRoom`, `sendMessage`, `receiveMessage`, `typing`, and `disconnect` enable instantaneous full-duplex room chats. |
| **18** | **EventEmitter ↔ Application Controllers** | `events/eventEmitter.js` ↔ `controllers/*.js` & `sockets/*.js` | Controllers emit `userRegistered`, `userLoggedIn`, `noteCreated`, `noteUpdated`, `noteDeleted`, and `messageSent`. Event handlers log structured audits to the console. |
| **19** | **Socket / Message Controller ↔ Message Model** | `sockets/chatSocket.js` ↔ `models/Message.js` | On `sendMessage`, the socket handler writes a document to `Message` collection in MongoDB before broadcasting `receiveMessage`. |
| **20** | **dotenv ↔ Database & JWT Configuration** | `backend/.env` ↔ `server.js`, `config/db.js`, `utils/generateToken.js` | `dotenv.config()` loads variables into `process.env.PORT`, `process.env.MONGO_URI`, and `process.env.JWT_SECRET`. |

---

## 5. Environment Variables Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/secure_connect_db
JWT_SECRET=supersecretjwtkey_secure_connect_platform_2026_unit4
JWT_EXPIRES_IN=1d
```

*(If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string `mongodb+srv://<username>:<password>@cluster0.mongodb.net/secure_connect_db`)*

---

## 6. Installation & Execution Guide

### Prerequisites
1. **Node.js** (v18.0 or higher recommended). Verify in terminal:
   ```powershell
   node -v
   npm -v
   ```
2. **MongoDB** (Local MongoDB Server or MongoDB Atlas).
   - If using local MongoDB, ensure `mongod` is running on port 27017.

### Step-by-Step Commands (VS Code Windows Terminal)

```powershell
# 1. Open the project folder in VS Code
cd "c:\webdev3\Web development Assignment 4\backend"

# 2. Install all dependencies (already configured in package.json)
npm install

# 3. Start local MongoDB (if not running as a Windows Service)
# Run in a separate terminal if needed:
& "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe" --dbpath "data/db" --bind_ip 127.0.0.1 --port 27017

# 4. Start the backend development server
npm run dev

# (Alternatively, for standard production start):
npm start
```

### Server Output:
```
==============================================================
🚀 [SERVER RUNNING]: http://localhost:5000
📡 [ENVIRONMENT]   : development
🛡️  [PLATFORM]      : Secure Connect and Communication Platform
==============================================================
[MongoDB Connected]: Host -> 127.0.0.1, Database -> secure_connect_db
```

### Running the Automated Test Suite (16/16 Verification)
Run the all-in-one test suite with:
```powershell
cd "c:\webdev3\Web development Assignment 4\backend"
npm run test:all
```
*(Runs mongod, boots server, tests all 16 endpoints/events, and prints summary report)*

---

## 7. Built-in Web UI Client Testing

Open your browser at:
👉 **`http://localhost:5000`**

The platform includes a built-in interactive dashboard:
1. **🔐 Authentication Tab**: Register users, log in as `User` or `Admin`, view and copy JWT tokens.
2. **📝 Secure Notes Tab**: Create, read, update, and delete notes. Only your own notes are visible.
3. **💬 Real-Time Chat Tab**: Enter a chat room (e.g., `#general`), see live connection status, typing indicators (`Alice is typing...`), and real-time message feeds.
4. **👑 Admin Dashboard Tab**: View platform metrics (total users, admins, notes, messages) and user directory (blocked for normal users, accessible for Admin).
5. **🧪 API Inspector Tab**: One-click buttons to test `/api/health`, `/api/auth/profile` with token, `/api/auth/profile` without token (401), and `/api/admin/dashboard` (403 for user).

---

## 8. Complete Postman API Testing Guide

### 1. User Signup (Standard User)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/signup`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
  ```json
  {
    "name": "Alice Smith",
    "email": "alice@example.com",
    "password": "Password123!",
    "role": "User"
  }
  ```
- **Expected Status**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6b03d5a9f50a6164bb3266b4",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "User",
      "createdAt": "2026-11-23T05:56:57.746Z"
    }
  }
  ```

---

### 2. User Login
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```
- **Expected Status**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6b03d5a9f50a6164bb3266b4",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "User"
    }
  }
  ```

---

### 3. Invalid Credentials Test
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/login`
- **Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "WrongPassword"
  }
  ```
- **Expected Status**: `401 Unauthorized`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Authentication Error: Invalid email or password."
  }
  ```

---

### 4. Access Protected Profile WITHOUT Token
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/auth/profile`
- **Headers**: *(No Authorization header)*
- **Expected Status**: `401 Unauthorized`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Access Denied: Authorization token missing in request headers."
  }
  ```

---

### 5. Access Protected Profile WITH Valid JWT
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/auth/profile`
- **Headers**:
  - `Authorization`: `Bearer <PASTE_YOUR_JWT_TOKEN_HERE>`
- **Expected Status**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "User profile retrieved successfully.",
    "user": {
      "id": "6b03d5a9f50a6164bb3266b4",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "User",
      "createdAt": "2026-11-23T05:56:57.746Z"
    }
  }
  ```

---

### 6. Create Note (POST /api/notes)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/notes`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <JWT_TOKEN>`
- **Body (raw JSON)**:
  ```json
  {
    "title": "Unit 4 Security Architecture",
    "description": "JWT authentication combined with bcrypt hashing ensures confidentiality and integrity."
  }
  ```
- **Expected Status**: `201 Created`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Note created successfully.",
    "note": {
      "title": "Unit 4 Security Architecture",
      "description": "JWT authentication combined with bcrypt hashing ensures confidentiality and integrity.",
      "userId": "6b03d5a9f50a6164bb3266b4",
      "createdAt": "2026-11-23T05:56:57.925Z",
      "updatedAt": "2026-11-23T05:56:57.925Z",
      "_id": "6b03d5a9f50a6164bb3266ba"
    }
  }
  ```

---

### 7. Get All Own Notes (GET /api/notes)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/notes`
- **Headers**: `Authorization`: `Bearer <JWT_TOKEN>`
- **Expected Status**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "notes": [
      {
        "_id": "6b03d5a9f50a6164bb3266ba",
        "title": "Unit 4 Security Architecture",
        "description": "JWT authentication combined with bcrypt hashing ensures confidentiality and integrity.",
        "userId": "6b03d5a9f50a6164bb3266b4",
        "createdAt": "2026-11-23T05:56:57.925Z",
        "updatedAt": "2026-11-23T05:56:57.925Z"
      }
    ]
  }
  ```

---

### 8. Update Note (PUT /api/notes/:id)
- **Method**: `PUT`
- **URL**: `http://localhost:5000/api/notes/<NOTE_ID>`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <JWT_TOKEN>`
- **Body (raw JSON)**:
  ```json
  {
    "title": "Unit 4 Security Architecture - FINAL",
    "description": "Updated description demonstrating secure PUT mutation."
  }
  ```
- **Expected Status**: `200 OK`

---

### 9. Delete Note (DELETE /api/notes/:id)
- **Method**: `DELETE`
- **URL**: `http://localhost:5000/api/notes/<NOTE_ID>`
- **Headers**: `Authorization`: `Bearer <JWT_TOKEN>`
- **Expected Status**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Note deleted successfully."
  }
  ```

---

### 10. RBAC Test: Access Admin Dashboard as Standard User (Expect 403)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/admin/dashboard`
- **Headers**: `Authorization`: `Bearer <ALICE_USER_TOKEN>`
- **Expected Status**: `403 Forbidden`
- **Expected Response**:
  ```json
  {
    "success": false,
    "message": "Forbidden: Access restricted. Role 'User' is not authorized to access this resource. Required role(s): [Admin]."
  }
  ```

---

### 11. RBAC Test: Access Admin Dashboard as Admin User (Expect 200)
- **Signup an Admin**: `POST /api/auth/signup` with `"role": "Admin"`
- **Call Dashboard**: `GET http://localhost:5000/api/admin/dashboard`
- **Headers**: `Authorization`: `Bearer <ADMIN_JWT_TOKEN>`
- **Expected Status**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "Admin metrics retrieved successfully.",
    "data": {
      "totalUsers": 2,
      "totalAdmins": 1,
      "totalNotes": 3,
      "totalMessages": 14,
      "serverUptime": "142 seconds",
      "serverTimestamp": "2026-11-23T05:57:02.000Z"
    }
  }
  ```

---

## 9. Socket.IO Real-Time Chat Testing

### How It Works:
1. Client connects to `http://localhost:5000`.
2. Socket sends handshake with JWT: `{ auth: { token: "<JWT_TOKEN>" } }`.
3. Server validates JWT. If invalid/missing, connection is aborted.
4. Client emits `joinRoom`: `{ roomId: "general" }`.
5. Server joins socket to room channel and sends `roomHistory` (last 50 messages).
6. When a user sends a message (`sendMessage`), server persists it in MongoDB `Message` collection, emits `messageSent` on EventEmitter, and broadcasts `receiveMessage` to all sockets in that room.
7. Typing events (`typing`) broadcast typing indicators (`{ userName: "Alice", isTyping: true }`) without database persistence.

### Two-Window Testing Guide:
1. Open `http://localhost:5000` in **Window 1** (Google Chrome).
   - Log in as **Alice**.
   - Navigate to the **💬 Real-Time Chat** tab and click **Join Room** (`general`).
2. Open `http://localhost:5000` in **Window 2** (Incognito window or Edge).
   - Register or log in as **Bob**.
   - Navigate to **💬 Real-Time Chat** and click **Join Room** (`general`).
3. Type in Alice's window: Notice Bob's screen displays `✍️ Alice is typing...`.
4. Send a message: Both Alice and Bob immediately see the message without refreshing the page!

---

## 10. College Lab Submission Screenshot Guide

To prepare your lab report submission, capture these three mandatory screenshots:

### 📸 Fig 1: Signup and Login Responses
- **Option A (Postman)**:
  - Take a screenshot of Postman sending `POST /api/auth/signup` and receiving `201 Created` with the JWT token in the response body.
  - Or `POST /api/auth/login` receiving `200 OK`.
- **Option B (Server Console)**:
  - Show the terminal with the green `[EVENT: USER_REGISTERED]` and `[EVENT: USER_LOGGED_IN]` banners printed by the `EventEmitter`.

### 📸 Fig 2: Notes API Blocked Without Token and Accessible With Valid JWT
- **Step 1**: Send `GET /api/notes` in Postman without the `Authorization` header. Capture the response showing `401 Unauthorized` (`Access Denied: Authorization token missing in request headers`).
- **Step 2**: Add `Authorization: Bearer <token>` and click Send. Capture the response showing `200 OK` with your personal notes array.
- **Tip**: You can also use the **Quick API Inspector** tab on `http://localhost:5000` to show the side-by-side terminal output!

### 📸 Fig 3: Real-Time Chat Activity Logged via Socket.IO
- Place two browser windows side by side:
  - **Left Window**: User 1 (e.g., Alice) logged in and chatting in room `#general`.
  - **Right Window**: User 2 (e.g., Bob) logged in and viewing Alice's messages in real time.
- Capture the chat bubbles and the server terminal showing:
  - `[Socket Connected]: Socket ID -> ...`
  - `[Socket Room]: User Alice joined room: "general"`
  - `[EVENT: MESSAGE_SENT] Room: general, Message: "Hello!"`

---

## 11. Security Checklist Satisfied

- [x] **No Plaintext Passwords**: Passwords hashed using bcrypt with salt rounds = 10.
- [x] **Secure JWT Verification**: Secret stored only in `.env`; tokens expire automatically (`1d`).
- [x] **Resource Ownership Isolation**: Users cannot view, update, or delete other users' notes.
- [x] **Role-Based Access Control**: Normal users cannot view admin metrics or user directories.
- [x] **Socket.IO Handshake Guard**: Unauthenticated WebSocket connections are rejected.
- [x] **MongoDB Injection Prevention**: Parameterized Mongoose queries throughout.
- [x] **Input Validation**: Rejects missing fields, malformed emails, and short passwords.
#   w e b d e v - I I I - a s s i g n m e n t - 4  
 