const EventEmitter = require('events');

/**
 * Custom EventEmitter Class for Application-wide Event Logging
 */
class AppEventEmitter extends EventEmitter {}

const appEventEmitter = new AppEventEmitter();

/**
 * Initialize Event Listeners
 * Kept separate from controllers to ensure loose coupling and event-driven architecture.
 */
const initEventListeners = () => {
  // 1. User Registered Event
  appEventEmitter.on('userRegistered', (userData) => {
    const timestamp = new Date().toISOString();
    console.log(`\n================== [EVENT: USER_REGISTERED] ==================`);
    console.log(`Timestamp : ${timestamp}`);
    console.log(`User ID   : ${userData.id}`);
    console.log(`Name      : ${userData.name}`);
    console.log(`Email     : ${userData.email}`);
    console.log(`Role      : ${userData.role}`);
    console.log(`Status    : Account created successfully in MongoDB`);
    console.log(`==============================================================\n`);
  });

  // 2. User Logged In Event
  appEventEmitter.on('userLoggedIn', (userData) => {
    const timestamp = new Date().toISOString();
    console.log(`\n=================== [EVENT: USER_LOGGED_IN] ===================`);
    console.log(`Timestamp : ${timestamp}`);
    console.log(`User ID   : ${userData.id}`);
    console.log(`Email     : ${userData.email}`);
    console.log(`Role      : ${userData.role}`);
    console.log(`Status    : Password verified via bcrypt & JWT generated`);
    console.log(`==============================================================\n`);
  });

  // 3. Note Created Event
  appEventEmitter.on('noteCreated', (noteData) => {
    const timestamp = new Date().toISOString();
    console.log(`\n=================== [EVENT: NOTE_CREATED] ====================`);
    console.log(`Timestamp : ${timestamp}`);
    console.log(`Note ID   : ${noteData.id}`);
    console.log(`Owner ID  : ${noteData.userId}`);
    console.log(`Title     : "${noteData.title}"`);
    console.log(`Status    : Persisted securely to MongoDB Notes collection`);
    console.log(`==============================================================\n`);
  });

  // 4. Note Updated Event
  appEventEmitter.on('noteUpdated', (noteData) => {
    const timestamp = new Date().toISOString();
    console.log(`\n=================== [EVENT: NOTE_UPDATED] ====================`);
    console.log(`Timestamp : ${timestamp}`);
    console.log(`Note ID   : ${noteData.id}`);
    console.log(`Owner ID  : ${noteData.userId}`);
    console.log(`Title     : "${noteData.title}"`);
    console.log(`Status    : Ownership verified and document updated`);
    console.log(`==============================================================\n`);
  });

  // 5. Note Deleted Event
  appEventEmitter.on('noteDeleted', (noteData) => {
    const timestamp = new Date().toISOString();
    console.log(`\n=================== [EVENT: NOTE_DELETED] ====================`);
    console.log(`Timestamp : ${timestamp}`);
    console.log(`Note ID   : ${noteData.id}`);
    console.log(`Owner ID  : ${noteData.userId}`);
    console.log(`Status    : Note document removed from MongoDB`);
    console.log(`==============================================================\n`);
  });

  // 6. Message Sent Event (Socket.IO Chat)
  appEventEmitter.on('messageSent', (messageData) => {
    const timestamp = new Date().toISOString();
    console.log(`\n=================== [EVENT: MESSAGE_SENT] ====================`);
    console.log(`Timestamp  : ${timestamp}`);
    console.log(`Sender ID  : ${messageData.senderId}`);
    console.log(`Sender     : ${messageData.senderName}`);
    console.log(`Room       : ${messageData.roomId}`);
    console.log(`Message    : "${messageData.message}"`);
    console.log(`Broadcast  : Dispatched in real time via Socket.IO`);
    console.log(`==============================================================\n`);
  });
};

module.exports = {
  appEventEmitter,
  initEventListeners
};
